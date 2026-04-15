import * as Blockly from 'blockly';
import { javascriptGenerator, Order } from 'blockly/javascript';

console.log('generators.ts loaded');

// Register blocks on the imported instance
const register = (gen: any) => {
  console.log('Registering blocks on generator:', gen);
  
  const target = gen.forBlock || gen;

  // Override scrub_ for this generator
  const originalScrub = gen.scrub_;
  gen.scrub_ = function(block: any, code: string, opt_thisOnly?: boolean) {
    let nextCode = '';
    if (!opt_thisOnly && block.nextConnection && block.nextConnection.targetBlock()) {
      nextCode = gen.blockToCode(block.nextConnection.targetBlock()) as string;
    }

    // Inject checkStop() and updateVars() before every statement block (except hat blocks which define the function)
    const isHatBlock = block.type === 'microbit_button_pressed' || 
                       block.type === 'event_when_green_flag_clicked' || 
                       block.type === 'event_when_received' ||
                       block.type === 'procedures_defnoreturn';
    
    // Scratch-like behavior: ignore top-level blocks that are not hat blocks
    if (!block.getParent() && !isHatBlock) {
      return '';
    }

    const isStatementBlock = !block.outputConnection;
    const checkStopCode = (!isHatBlock && isStatementBlock) ? 'checkStop();\n' : '';

    // Variable tracking
    let updateVarsCode = '';
    if (!isHatBlock && isStatementBlock) {
      const vars = block.workspace.getAllVariables().map((v: any) => v.name);
      if (vars.length > 0) {
        const varObject = `{${vars.map((v: string) => `${v}: typeof ${v} !== 'undefined' ? ${v} : undefined`).join(', ')}}`;
        updateVarsCode = `updateVars(${varObject});\n`;
      }
    }

    if (block.type === 'microbit_button_pressed') {
      const button = block.getFieldValue('BUTTON');
      const methodName = button === 'A+B' ? 'onButtonAB' : `onButton${button}`;
      return `boardRef.current.${methodName}(async () => {\ntry {\n${checkStopCode}${code}${updateVarsCode}${nextCode}} catch (e) { if (e?.message !== 'Execution stopped') console.error(e); }\n});\n`;
    }
    if (block.type === 'event_when_green_flag_clicked') {
      return `boardRef.current.onGreenFlag(async () => {\ntry {\n${checkStopCode}${code}${updateVarsCode}${nextCode}} catch (e) { if (e?.message !== 'Execution stopped') console.error(e); }\n});\n`;
    }
    if (block.type === 'event_when_received') {
      const shape = block.getFieldValue('SHAPE');
      const color = block.getFieldValue('COLOR');
      return `boardRef.current.onBroadcast('${shape}', '${color}', async () => {\ntry {\n${checkStopCode}${code}${updateVarsCode}${nextCode}} catch (e) { if (e?.message !== 'Execution stopped') console.error(e); }\n});\n`;
    }

    return checkStopCode + code + updateVarsCode + nextCode;
  };

  target['procedures_defnoreturn'] = function(block: any) {
    const funcName = javascriptGenerator.getProcedureName(block.getFieldValue('NAME'));
    const branch = javascriptGenerator.statementToCode(block, 'STACK');
    return `async function ${funcName}() {\n${branch}}\n`;
  };

  target['procedures_callnoreturn'] = function(block: any) {
    const funcName = javascriptGenerator.getProcedureName(block.getFieldValue('NAME'));
    return `await ${funcName}();\n`;
  };

  target['microbit_show_icon'] = function(block: any) {
    const icon = block.getFieldValue('ICON');
    return `boardRef.current.showIcon('${icon}');\n`;
  };

  target['microbit_show_text'] = function(block: any) {
    const text = block.getFieldValue('TEXT');
    return `boardRef.current.showText('${text}');\n`;
  };

  target['microbit_set_led_color'] = function(block: any) {
    const color = block.getFieldValue('COLOR');
    return `boardRef.current.setLedColor('${color}');\n`;
  };

  target['microbit_button_pressed'] = function(block: any) {
    return ''; // Handled by scrub_
  };

  target['microbit_set_pin'] = function(block: any) {
    const pin = block.getFieldValue('PIN');
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
    return `boardRef.current.setPin('${pin}', ${value});\n`;
  };

  target['microbit_led_pin'] = function(block: any) {
    const pin = block.getFieldValue('PIN');
    const state = block.getFieldValue('STATE');
    return `boardRef.current.setPin('${pin}', ${state});\n`;
  };

  target['microbit_tm1637_show_number'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
    return `boardRef.current.setTM1637('${port}', ${value});\n`;
  };

  target['microbit_set_motor'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    const direction = block.getFieldValue('DIRECTION');
    const speed = javascriptGenerator.valueToCode(block, 'SPEED', Order.ATOMIC) || '0';
    return `boardRef.current.setMotor('${port}', '${direction}', ${speed});\n`;
  };

  target['microbit_stop_motor'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    return `boardRef.current.setMotor('${port}', 'FD', 0);\n`;
  };

  target['microbit_set_servo'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    const angle = javascriptGenerator.valueToCode(block, 'ANGLE', Order.ATOMIC) || '90';
    return `boardRef.current.setServo('${port}', ${angle});\n`;
  };

  target['microbit_ultrasonic_distance'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    return [`await boardRef.current.getUltrasonicDistance('${port}')`, Order.AWAIT];
  };

  target['microbit_color_sensor'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    return [`await boardRef.current.getColor('${port}')`, Order.AWAIT];
  };

  target['microbit_light_sensor'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    return [`await boardRef.current.getLightLevel('${port}')`, Order.AWAIT];
  };

  target['microbit_temperature_sensor'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    return [`await boardRef.current.getTemperature('${port}')`, Order.AWAIT];
  };
  
  target['microbit_soil_moisture'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    return [`await boardRef.current.getSoilMoisture('${port}')`, Order.AWAIT];
  };

  target['microbit_potentiometer'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    return [`await boardRef.current.getPotentiometer('${port}')`, Order.AWAIT];
  };

  target['microbit_ledgraph'] = function(block: any) {
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '0';
    const max = javascriptGenerator.valueToCode(block, 'MAX', Order.ATOMIC) || '100';
    return `boardRef.current.ledGraph(${value}, ${max});\n`;
  };

  target['microbit_dht11'] = function(block: any) {
    const mode = block.getFieldValue('MODE');
    const port = block.getFieldValue('PORT');
    const method = mode === 'TEMP' ? 'getTemperature' : 'getHumidity';
    return [`await boardRef.current.${method}('${port}')`, Order.AWAIT];
  };

  target['microbit_play_tone'] = function(block: any) {
    const tone = javascriptGenerator.valueToCode(block, 'TONE', Order.ATOMIC) || '440';
    return `boardRef.current.playTone(${tone});\n`;
  };

  target['event_when_green_flag_clicked'] = function(block: any) {
    return ''; // Handled by scrub_
  };

  target['event_broadcast'] = function(block: any) {
    const shape = block.getFieldValue('SHAPE');
    const color = block.getFieldValue('COLOR');
    return `boardRef.current.broadcast('${shape}', '${color}');\n`;
  };

  target['event_when_received'] = function(block: any) {
    return ''; // Handled by scrub_
  };

  target['control_repeat'] = function(block: any) {
    const times = block.getFieldValue('TIMES');
    const branch = javascriptGenerator.statementToCode(block, 'DO');
    const loopVar = 'i_' + Math.random().toString(36).substr(2, 5);
    return `for (let ${loopVar} = 0; ${loopVar} < ${times}; ${loopVar}++) {\n  checkStop();\n${branch}  await new Promise(resolve => setTimeout(resolve, 20));\n}\n`;
  };

  target['control_forever'] = function(block: any) {
    const branch = javascriptGenerator.statementToCode(block, 'DO');
    return `while (true) {\n  checkStop();\n${branch}  await new Promise(resolve => setTimeout(resolve, 20));\n}\n`;
  };

  target['control_wait_until'] = function(block: any) {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', Order.NONE) || 'false';
    return `while (!(${condition})) {\n  checkStop();\n  await new Promise(resolve => setTimeout(resolve, 20));\n}\n`;
  };

  target['control_wait'] = function(block: any) {
    const duration = block.getFieldValue('DURATION');
    return `checkStop();\nawait new Promise(resolve => setTimeout(resolve, ${duration} * 1000));\ncheckStop();\n`;
  };

  target['control_if'] = function(block: any) {
    const condition = javascriptGenerator.valueToCode(block, 'IF0', Order.NONE) || 'false';
    const branch = javascriptGenerator.statementToCode(block, 'DO0');
    return `if (${condition}) {\n${branch}}\n`;
  };

  target['control_if_else'] = function(block: any) {
    const condition = javascriptGenerator.valueToCode(block, 'IF0', Order.NONE) || 'false';
    const branch0 = javascriptGenerator.statementToCode(block, 'DO0');
    const branch1 = javascriptGenerator.statementToCode(block, 'ELSE');
    return `if (${condition}) {\n${branch0}} else {\n${branch1}}\n`;
  };

  target['operator_add'] = function(block: any) {
    const val1 = javascriptGenerator.valueToCode(block, 'NUM1', Order.ADDITION) || '0';
    const val2 = javascriptGenerator.valueToCode(block, 'NUM2', Order.ADDITION) || '0';
    return [`${val1} + ${val2}`, Order.ADDITION];
  };

  target['operator_subtract'] = function(block: any) {
    const val1 = javascriptGenerator.valueToCode(block, 'NUM1', Order.SUBTRACTION) || '0';
    const val2 = javascriptGenerator.valueToCode(block, 'NUM2', Order.SUBTRACTION) || '0';
    return [`${val1} - ${val2}`, Order.SUBTRACTION];
  };

  target['operator_multiply'] = function(block: any) {
    const val1 = javascriptGenerator.valueToCode(block, 'NUM1', Order.MULTIPLICATION) || '0';
    const val2 = javascriptGenerator.valueToCode(block, 'NUM2', Order.MULTIPLICATION) || '0';
    return [`${val1} * ${val2}`, Order.MULTIPLICATION];
  };

  target['operator_divide'] = function(block: any) {
    const val1 = javascriptGenerator.valueToCode(block, 'NUM1', Order.DIVISION) || '0';
    const val2 = javascriptGenerator.valueToCode(block, 'NUM2', Order.DIVISION) || '0';
    return [`${val1} / ${val2}`, Order.DIVISION];
  };

  target['operator_random'] = function(block: any) {
    const from = javascriptGenerator.valueToCode(block, 'FROM', Order.NONE) || '1';
    const to = javascriptGenerator.valueToCode(block, 'TO', Order.NONE) || '10';
    return [`Math.floor(Math.random() * (${to} - ${from} + 1)) + ${from}`, Order.FUNCTION_CALL];
  };

  target['operator_lt'] = function(block: any) {
    const val1 = javascriptGenerator.valueToCode(block, 'OP1', Order.RELATIONAL) || '0';
    const val2 = javascriptGenerator.valueToCode(block, 'OP2', Order.RELATIONAL) || '0';
    return [`${val1} < ${val2}`, Order.RELATIONAL];
  };

  target['operator_equals'] = function(block: any) {
    const val1 = javascriptGenerator.valueToCode(block, 'OP1', Order.EQUALITY) || '0';
    const val2 = javascriptGenerator.valueToCode(block, 'OP2', Order.EQUALITY) || '0';
    return [`${val1} === ${val2}`, Order.EQUALITY];
  };

  target['operator_gt'] = function(block: any) {
    const val1 = javascriptGenerator.valueToCode(block, 'OP1', Order.RELATIONAL) || '0';
    const val2 = javascriptGenerator.valueToCode(block, 'OP2', Order.RELATIONAL) || '0';
    return [`${val1} > ${val2}`, Order.RELATIONAL];
  };

  target['operator_and'] = function(block: any) {
    const val1 = javascriptGenerator.valueToCode(block, 'BOOL1', Order.LOGICAL_AND) || 'false';
    const val2 = javascriptGenerator.valueToCode(block, 'BOOL2', Order.LOGICAL_AND) || 'false';
    return [`${val1} && ${val2}`, Order.LOGICAL_AND];
  };

  target['operator_or'] = function(block: any) {
    const val1 = javascriptGenerator.valueToCode(block, 'BOOL1', Order.LOGICAL_OR) || 'false';
    const val2 = javascriptGenerator.valueToCode(block, 'BOOL2', Order.LOGICAL_OR) || 'false';
    return [`${val1} || ${val2}`, Order.LOGICAL_OR];
  };

  target['operator_not'] = function(block: any) {
    const val = javascriptGenerator.valueToCode(block, 'BOOL', Order.LOGICAL_NOT) || 'false';
    return [`!${val}`, Order.LOGICAL_NOT];
  };

  target['text'] = function(block: any) {
    const text = block.getFieldValue('TEXT');
    return [`'${text}'`, Order.ATOMIC];
  };
};

register(javascriptGenerator);

// Ensure Blockly.JavaScript is also registered if it's a different instance
if ((Blockly as any).JavaScript && (Blockly as any).JavaScript !== javascriptGenerator) {
    register((Blockly as any).JavaScript);
}

export { javascriptGenerator };
