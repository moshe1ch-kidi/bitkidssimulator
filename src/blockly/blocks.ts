import * as Blockly from 'blockly';
import { FieldColour } from '@blockly/field-colour';
import { FieldSlider } from '@blockly/field-slider';

Blockly.fieldRegistry.register('field_colour', FieldColour);
Blockly.fieldRegistry.register('field_slider', FieldSlider);

const ICONS: { [key: string]: number[] } = {
  'HEART': [1, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 22],
  'HAPPY': [1, 3, 6, 8, 16, 17, 18, 20, 24],
  'SAD': [6, 8, 16, 18, 21, 22, 23],
  'ARROW_SE': [0, 6, 12, 14, 18, 19, 22, 23, 24],
  'ARROW_S': [2, 7, 10, 12, 14, 16, 17, 18, 22],
  'ARROW_SW': [4, 8, 10, 12, 15, 16, 20, 21, 22],
  'ARROW_W': [2, 6, 10, 11, 12, 13, 14, 16, 22],
  'ARROW_NW': [0, 1, 2, 5, 6, 10, 12, 18, 24]
};

const createIconDropdownOption = (name: string, key: string): [any, string] => {
  const activeIndices = ICONS[key] || [];
  let rects = '';
  for (let i = 0; i < 25; i++) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const x = col * 5;
    const y = row * 5;
    const isActive = activeIndices.includes(i);
    const fill = isActive ? '#ffffff' : 'rgba(255,255,255,0.3)';
    rects += `<rect x="${x}" y="${y}" width="4" height="4" fill="${fill}" rx="0.5" />`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${rects}</svg>`;
  const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  return [{ src: dataUri, width: 24, height: 24, alt: name }, key];
};

export const microbitBlocks = [
  {
    type: 'microbit_show_icon',
    message0: 'show icon %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'ICON',
        options: [
          createIconDropdownOption('Heart', 'HEART'),
          createIconDropdownOption('Happy', 'HAPPY'),
          createIconDropdownOption('Sad', 'SAD'),
          createIconDropdownOption('Arrow South East', 'ARROW_SE'),
          createIconDropdownOption('Arrow South', 'ARROW_S'),
          createIconDropdownOption('Arrow South West', 'ARROW_SW'),
          createIconDropdownOption('Arrow West', 'ARROW_W'),
          createIconDropdownOption('Arrow North West', 'ARROW_NW'),
        ],
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#0FBD8C',
  },
  {
    type: 'microbit_show_text',
    message0: 'show text %1',
    args0: [
      {
        type: 'field_input',
        name: 'TEXT',
        text: 'Hello',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#0FBD8C',
  },
  {
    type: 'microbit_set_led_color',
    message0: 'set LED color %1',
    args0: [
      {
        type: 'field_colour',
        name: 'COLOR',
        colour: '#ef4444',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#0FBD8C',
  },
  {
    type: 'microbit_button_pressed',
    message0: 'on button %1 pressed',
    args0: [
      {
        type: 'field_dropdown',
        name: 'BUTTON',
        options: [
          ['A', 'A'],
          ['B', 'B'],
          ['A+B', 'A+B'],
        ],
      },
    ],
    nextStatement: null,
    colour: '#FFBF00',
    hat: 'cap',
  },
  {
    type: 'microbit_set_pin',
    message0: 'set pin %1 to %2',
    args0: [
      { 
        type: 'field_dropdown', 
        name: 'PIN', 
        options: [
          ['J1', 'J1'], ['J2', 'J2'], ['J3', 'J3'], ['J4', 'J4'],
          ['I1', 'I1'], ['I2', 'I2'], ['I3', 'I3'], ['I4', 'I4']
        ] 
      },
      { type: 'input_value', name: 'VALUE', check: 'Number' },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#0FBD8C',
  },
  {
    type: 'microbit_set_motor',
    message0: 'set motor %1 %2 speed %3',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['M1', 'M1'], ['M2', 'M2'], ['M3', 'M3'], ['M4', 'M4']] },
      { type: 'field_dropdown', name: 'DIRECTION', options: [['FD', 'FORWARD'], ['BK', 'BACKWARD']] },
      { type: 'field_number', name: 'SPEED', value: 50, min: 0, max: 100 },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#0FBD8C',
  },
  {
    type: 'microbit_set_servo',
    message0: 'Servo %1 angle %2',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['S1', 'S1'], ['S2', 'S2'], ['S3', 'S3'], ['S4', 'S4']] },
      { type: 'field_slider', name: 'ANGLE', value: 90, min: 0, max: 180 },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#0FBD8C',
  },
  {
    type: 'microbit_ultrasonic_distance',
    message0: 'Ultrasonic sensor %1 distance',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['J1', 'J1'], ['J2', 'J2'], ['J3', 'J3'], ['J4', 'J4']] },
    ],
    output: 'Number',
    colour: '#0FBD8C',
  },
  {
    type: 'microbit_color_sensor',
    message0: 'Color sensor %1 color',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['J1', 'J1'], ['J2', 'J2'], ['J3', 'J3'], ['J4', 'J4']] },
    ],
    output: 'String',
    colour: '#0FBD8C',
  },
  {
    type: 'microbit_light_sensor',
    message0: 'Light sensor %1 value',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['J1', 'J1'], ['J2', 'J2']] },
    ],
    output: 'Number',
    colour: '#0FBD8C',
  },
  {
    type: 'microbit_led_toggle',
    message0: 'LED %1 toggle to %2',
    args0: [
      {
        type: 'field_dropdown',
        name: 'PORT',
        options: [
          ['J1', 'J1'], ['J2', 'J2'], ['J3', 'J3'], ['J4', 'J4'],
          ['I1', 'I1'], ['I2', 'I2'], ['I3', 'I3'], ['I4', 'I4']
        ]
      },
      {
        type: 'field_dropdown',
        name: 'STATE',
        options: [['ON', 'ON'], ['OFF', 'OFF']]
      }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#FF661A',
  },
  {
    type: 'microbit_play_tone',
    message0: 'play tone %1',
    args0: [
      { type: 'input_value', name: 'TONE', check: 'Number' },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#0FBD8C',
  },
  {
    type: 'event_when_green_flag_clicked',
    message0: 'when %1 clicked',
    args0: [
      {
        type: 'field_image',
        src: 'https://scratch.mit.edu/static/assets/e5e29955896a3a1a361304523789090b.svg',
        width: 24,
        height: 24,
        alt: 'Green Flag'
      }
    ],
    nextStatement: null,
    colour: '#FFBF00',
    hat: 'cap',
  },
  {
    type: 'control_repeat',
    message0: 'repeat %1',
    args0: [{ type: 'field_number', name: 'TIMES', value: 10 }],
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'DO' }],
    previousStatement: null,
    nextStatement: null,
    colour: '#FFAB19',
  },
  {
    type: 'control_forever',
    message0: 'forever',
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'DO' }],
    previousStatement: null,
    colour: '#FFAB19',
  },
  {
    type: 'control_wait_until',
    message0: 'wait until %1',
    args0: [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }],
    previousStatement: null,
    nextStatement: null,
    colour: '#FFAB19',
  },
  {
    type: 'control_wait',
    message0: 'wait %1 seconds',
    args0: [{ type: 'field_number', name: 'DURATION', value: 1 }],
    previousStatement: null,
    nextStatement: null,
    colour: '#FFAB19',
  },
  {
    type: 'control_if',
    message0: 'if %1 then',
    args0: [
      {
        type: 'input_value',
        name: 'IF0',
        check: 'Boolean',
      },
    ],
    message1: '%1',
    args1: [
      {
        type: 'input_statement',
        name: 'DO0',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#FFAB19',
  },
  {
    type: 'control_if_else',
    message0: 'if %1 then',
    args0: [
      {
        type: 'input_value',
        name: 'IF0',
        check: 'Boolean',
      },
    ],
    message1: '%1',
    args1: [
      {
        type: 'input_statement',
        name: 'DO0',
      },
    ],
    message2: 'else',
    message3: '%1',
    args3: [
      {
        type: 'input_statement',
        name: 'ELSE',
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#FFAB19',
  },
  {
    type: 'operator_add',
    message0: '%1 + %2',
    args0: [
      { type: 'input_value', name: 'NUM1' },
      { type: 'input_value', name: 'NUM2' }
    ],
    inputsInline: true,
    output: 'Number',
    colour: '#59C059'
  },
  {
    type: 'operator_subtract',
    message0: '%1 - %2',
    args0: [
      { type: 'input_value', name: 'NUM1' },
      { type: 'input_value', name: 'NUM2' }
    ],
    inputsInline: true,
    output: 'Number',
    colour: '#59C059'
  },
  {
    type: 'operator_multiply',
    message0: '%1 * %2',
    args0: [
      { type: 'input_value', name: 'NUM1' },
      { type: 'input_value', name: 'NUM2' }
    ],
    inputsInline: true,
    output: 'Number',
    colour: '#59C059'
  },
  {
    type: 'operator_divide',
    message0: '%1 / %2',
    args0: [
      { type: 'input_value', name: 'NUM1' },
      { type: 'input_value', name: 'NUM2' }
    ],
    inputsInline: true,
    output: 'Number',
    colour: '#59C059'
  },
  {
    type: 'operator_random',
    message0: 'pick random %1 to %2',
    args0: [
      { type: 'input_value', name: 'FROM' },
      { type: 'input_value', name: 'TO' }
    ],
    inputsInline: true,
    output: 'Number',
    colour: '#59C059'
  },
  {
    type: 'operator_lt',
    message0: '%1 < %2',
    args0: [
      { type: 'input_value', name: 'OP1' },
      { type: 'input_value', name: 'OP2' }
    ],
    inputsInline: true,
    output: 'Boolean',
    colour: '#59C059'
  },
  {
    type: 'operator_equals',
    message0: '%1 = %2',
    args0: [
      { type: 'input_value', name: 'OP1' },
      { type: 'input_value', name: 'OP2' }
    ],
    inputsInline: true,
    output: 'Boolean',
    colour: '#59C059'
  },
  {
    type: 'operator_gt',
    message0: '%1 > %2',
    args0: [
      { type: 'input_value', name: 'OP1' },
      { type: 'input_value', name: 'OP2' }
    ],
    inputsInline: true,
    output: 'Boolean',
    colour: '#59C059'
  },
  {
    type: 'operator_and',
    message0: '%1 and %2',
    args0: [
      { type: 'input_value', name: 'BOOL1', check: 'Boolean' },
      { type: 'input_value', name: 'BOOL2', check: 'Boolean' }
    ],
    inputsInline: true,
    output: 'Boolean',
    colour: '#59C059'
  },
  {
    type: 'operator_or',
    message0: '%1 or %2',
    args0: [
      { type: 'input_value', name: 'BOOL1', check: 'Boolean' },
      { type: 'input_value', name: 'BOOL2', check: 'Boolean' }
    ],
    inputsInline: true,
    output: 'Boolean',
    colour: '#59C059'
  },
  {
    type: 'operator_not',
    message0: 'not %1',
    args0: [
      { type: 'input_value', name: 'BOOL', check: 'Boolean' }
    ],
    inputsInline: false,
    output: 'Boolean',
    colour: '#59C059'
  },
];

// Register blocks
Blockly.defineBlocksWithJsonArray(microbitBlocks);
