import * as Blockly from 'blockly';
import { pythonGenerator, Order } from 'blockly/python';

const registerPython = (gen: any) => {
  const target = gen.forBlock || gen;

  // Override scrub_ for this generator to handle hat blocks and next blocks
  const originalScrub = gen.scrub_;
  gen.scrub_ = function(block: any, code: string, opt_thisOnly?: boolean) {
    let nextCode = '';
    if (!opt_thisOnly && block.nextConnection && block.nextConnection.targetBlock()) {
      nextCode = gen.blockToCode(block.nextConnection.targetBlock()) as string;
    }

    const isHatBlock = block.type === 'microbit_button_pressed' || 
                       block.type === 'event_when_green_flag_clicked' || 
                       block.type === 'event_when_received' ||
                       block.type === 'procedures_defnoreturn';
    
    // Scratch-like behavior: ignore top-level blocks that are not hat blocks
    if (!block.getParent() && !isHatBlock) {
      return '';
    }

    if (block.type === 'microbit_button_pressed') {
      const button = block.getFieldValue('BUTTON');
      const branch = gen.prefixLines(nextCode, gen.INDENT);
      return `def on_button_${button.toLowerCase().replace('+', '')}_pressed():\n${branch || '  pass'}\n`;
    }
    if (block.type === 'event_when_green_flag_clicked') {
      const branch = gen.prefixLines(nextCode, gen.INDENT);
      return `def on_start():\n${branch || '  pass'}\n\non_start()\n`;
    }
    if (block.type === 'event_when_received') {
      const shape = block.getFieldValue('SHAPE').toLowerCase();
      const color = block.getFieldValue('COLOR').toLowerCase();
      const branch = gen.prefixLines(nextCode, gen.INDENT);
      return `def on_message_${shape}_${color}_received():\n${branch || '  pass'}\n`;
    }

    return code + nextCode;
  };

  target['microbit_show_icon'] = function(block: any) {
    const icon = block.getFieldValue('ICON');
    return `microbit.show_icon('${icon}')\n`;
  };

  target['microbit_show_text'] = function(block: any) {
    const text = block.getFieldValue('TEXT');
    return `microbit.show_text('${text}')\n`;
  };

  target['microbit_set_led_color'] = function(block: any) {
    const color = block.getFieldValue('COLOR');
    return `microbit.set_led_color('${color}')\n`;
  };

  target['microbit_button_pressed'] = function(block: any) {
    return ''; // Handled by scrub_
  };

  target['microbit_set_pin'] = function(block: any) {
    const pin = block.getFieldValue('PIN');
    const value = block.getFieldValue('VALUE');
    return `microbit.set_pin('${pin}', ${value})\n`;
  };

  target['microbit_set_motor'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    const direction = block.getFieldValue('DIRECTION');
    const speed = block.getFieldValue('SPEED');
    return `microbit.set_motor('${port}', '${direction}', ${speed})\n`;
  };

  target['microbit_stop_motor'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    return `microbit.set_motor('${port}', 'FORWARD', 0)\n`;
  };

  target['microbit_set_servo'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    const angle = block.getFieldValue('ANGLE');
    return `microbit.set_servo('${port}', ${angle})\n`;
  };

  target['microbit_ultrasonic_distance'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    return [`microbit.get_ultrasonic_distance('${port}')`, Order.FUNCTION_CALL];
  };

  target['microbit_color_sensor'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    return [`microbit.get_color('${port}')`, Order.FUNCTION_CALL];
  };

  target['microbit_light_sensor'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    return [`microbit.get_light_level('${port}')`, Order.FUNCTION_CALL];
  };

  target['microbit_temperature_sensor'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    return [`microbit.get_temperature('${port}')`, Order.FUNCTION_CALL];
  };
  
  target['microbit_soil_moisture'] = function(block: any) {
    const port = block.getFieldValue('PORT');
    return [`microbit.get_soil_moisture('${port}')`, Order.FUNCTION_CALL];
  };

  target['microbit_ledgraph'] = function(block: any) {
    const value = pythonGenerator.valueToCode(block, 'VALUE', Order.NONE) || '0';
    const max = pythonGenerator.valueToCode(block, 'MAX', Order.NONE) || '100';
    return `microbit.led_graph(${value}, ${max})\n`;
  };

  target['microbit_dht11'] = function(block: any) {
    const mode = block.getFieldValue('MODE');
    const port = block.getFieldValue('PORT');
    const method = mode === 'TEMP' ? 'get_temperature' : 'get_humidity';
    return [`microbit.${method}('${port}')`, Order.FUNCTION_CALL];
  };

  target['microbit_play_tone'] = function(block: any) {
    const tone = pythonGenerator.valueToCode(block, 'TONE', Order.NONE) || '440';
    return `microbit.play_tone(${tone})\n`;
  };

  target['event_when_green_flag_clicked'] = function(block: any) {
    return ''; // Handled by scrub_
  };

  target['event_broadcast'] = function(block: any) {
    const shape = block.getFieldValue('SHAPE').toLowerCase();
    const color = block.getFieldValue('COLOR').toLowerCase();
    return `microbit.broadcast('${shape}', '${color}')\n`;
  };

  target['event_when_received'] = function(block: any) {
    return ''; // Handled by scrub_
  };

  target['control_repeat'] = function(block: any) {
    const times = block.getFieldValue('TIMES');
    const branch = pythonGenerator.statementToCode(block, 'DO');
    return `for i in range(${times}):\n${branch || '  pass'}\n`;
  };

  target['control_forever'] = function(block: any) {
    const branch = pythonGenerator.statementToCode(block, 'DO');
    return `while True:\n${branch || '  pass'}\n`;
  };

  target['control_wait_until'] = function(block: any) {
    const condition = pythonGenerator.valueToCode(block, 'CONDITION', Order.NONE) || 'False';
    return `while not (${condition}):\n  pass\n`;
  };

  target['control_wait'] = function(block: any) {
    const duration = block.getFieldValue('DURATION');
    return `time.sleep(${duration})\n`;
  };

  target['control_if'] = function(block: any) {
    const condition = pythonGenerator.valueToCode(block, 'IF0', Order.NONE) || 'False';
    const branch = pythonGenerator.statementToCode(block, 'DO0');
    return `if ${condition}:\n${branch || '  pass'}\n`;
  };

  target['control_if_else'] = function(block: any) {
    const condition = pythonGenerator.valueToCode(block, 'IF0', Order.NONE) || 'False';
    const branch0 = pythonGenerator.statementToCode(block, 'DO0');
    const branch1 = pythonGenerator.statementToCode(block, 'ELSE');
    return `if ${condition}:\n${branch0 || '  pass'}\nelse:\n${branch1 || '  pass'}\n`;
  };

  target['operator_add'] = function(block: any) {
    const val1 = pythonGenerator.valueToCode(block, 'NUM1', Order.ADDITIVE) || '0';
    const val2 = pythonGenerator.valueToCode(block, 'NUM2', Order.ADDITIVE) || '0';
    return [`${val1} + ${val2}`, Order.ADDITIVE];
  };

  target['operator_subtract'] = function(block: any) {
    const val1 = pythonGenerator.valueToCode(block, 'NUM1', Order.ADDITIVE) || '0';
    const val2 = pythonGenerator.valueToCode(block, 'NUM2', Order.ADDITIVE) || '0';
    return [`${val1} - ${val2}`, Order.ADDITIVE];
  };

  target['operator_multiply'] = function(block: any) {
    const val1 = pythonGenerator.valueToCode(block, 'NUM1', Order.MULTIPLICATIVE) || '0';
    const val2 = pythonGenerator.valueToCode(block, 'NUM2', Order.MULTIPLICATIVE) || '0';
    return [`${val1} * ${val2}`, Order.MULTIPLICATIVE];
  };

  target['operator_divide'] = function(block: any) {
    const val1 = pythonGenerator.valueToCode(block, 'NUM1', Order.MULTIPLICATIVE) || '0';
    const val2 = pythonGenerator.valueToCode(block, 'NUM2', Order.MULTIPLICATIVE) || '0';
    return [`${val1} / ${val2}`, Order.MULTIPLICATIVE];
  };

  target['operator_random'] = function(block: any) {
    const from = pythonGenerator.valueToCode(block, 'FROM', Order.NONE) || '1';
    const to = pythonGenerator.valueToCode(block, 'TO', Order.NONE) || '10';
    return [`random.randint(${from}, ${to})`, Order.FUNCTION_CALL];
  };

  target['operator_lt'] = function(block: any) {
    const val1 = pythonGenerator.valueToCode(block, 'OP1', Order.RELATIONAL) || '0';
    const val2 = pythonGenerator.valueToCode(block, 'OP2', Order.RELATIONAL) || '0';
    return [`${val1} < ${val2}`, Order.RELATIONAL];
  };

  target['operator_equals'] = function(block: any) {
    const val1 = pythonGenerator.valueToCode(block, 'OP1', Order.RELATIONAL) || '0';
    const val2 = pythonGenerator.valueToCode(block, 'OP2', Order.RELATIONAL) || '0';
    return [`${val1} == ${val2}`, Order.RELATIONAL];
  };

  target['operator_gt'] = function(block: any) {
    const val1 = pythonGenerator.valueToCode(block, 'OP1', Order.RELATIONAL) || '0';
    const val2 = pythonGenerator.valueToCode(block, 'OP2', Order.RELATIONAL) || '0';
    return [`${val1} > ${val2}`, Order.RELATIONAL];
  };

  target['operator_and'] = function(block: any) {
    const val1 = pythonGenerator.valueToCode(block, 'BOOL1', Order.LOGICAL_AND) || 'False';
    const val2 = pythonGenerator.valueToCode(block, 'BOOL2', Order.LOGICAL_AND) || 'False';
    return [`${val1} and ${val2}`, Order.LOGICAL_AND];
  };

  target['operator_or'] = function(block: any) {
    const val1 = pythonGenerator.valueToCode(block, 'BOOL1', Order.LOGICAL_OR) || 'False';
    const val2 = pythonGenerator.valueToCode(block, 'BOOL2', Order.LOGICAL_OR) || 'False';
    return [`${val1} or ${val2}`, Order.LOGICAL_OR];
  };

  target['operator_not'] = function(block: any) {
    const val = pythonGenerator.valueToCode(block, 'BOOL', Order.LOGICAL_NOT) || 'False';
    return [`not ${val}`, Order.LOGICAL_NOT];
  };

  target['text'] = function(block: any) {
    const text = block.getFieldValue('TEXT');
    return [`'${text}'`, Order.ATOMIC];
  };
};

registerPython(pythonGenerator);

export { pythonGenerator };
