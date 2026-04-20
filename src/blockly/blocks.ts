 import * as Blockly from 'blockly';
import 'blockly/blocks';
import { FieldColour } from '@blockly/field-colour';
import { FieldSlider } from '@blockly/field-slider';
import { FieldBitmap } from '@blockly/field-bitmap';

try {
  Blockly.fieldRegistry.register('field_colour', FieldColour);
} catch (e) {
  console.warn('field_colour already registered');
}

try {
  Blockly.fieldRegistry.register('field_slider', FieldSlider);
} catch (e) {
  console.warn('field_slider already registered');
}

try {
  Blockly.fieldRegistry.register('field_bitmap', FieldBitmap);
} catch (e) {
  console.warn('field_bitmap already registered');
}

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
  // Base64 is more robust in production builds
  const base64Svg = btoa(svg);
  const dataUri = `data:image/svg+xml;base64,${base64Svg}`;
  return [{ src: dataUri, width: 24, height: 24, alt: name }, key];
};

const SHAPE_OPTIONS = [
  [{ src: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'), width: 20, height: 20, alt: 'Star' }, 'STAR'],
  [{ src: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>'), width: 20, height: 20, alt: 'Heart' }, 'HEART'],
  [{ src: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>'), width: 20, height: 20, alt: 'Circle' }, 'CIRCLE'],
  [{ src: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>'), width: 20, height: 20, alt: 'Square' }, 'SQUARE'],
];

const COLOR_OPTIONS = [
  [{ src: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="red"/></svg>'), width: 20, height: 20, alt: 'Red' }, 'RED'],
  [{ src: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="green"/></svg>'), width: 20, height: 20, alt: 'Green' }, 'GREEN'],
  [{ src: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="blue"/></svg>'), width: 20, height: 20, alt: 'Blue' }, 'BLUE'],
  [{ src: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="yellow"/></svg>'), width: 20, height: 20, alt: 'Yellow' }, 'YELLOW'],
];

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
    colour: '#4C97FF',
  },
  {
    type: 'microbit_show_leds',
    message0: 'show LEDs %1',
    args0: [
      {
        type: 'field_bitmap',
        name: 'LEDS',
        value: [
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
        width: 5,
        height: 5,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#4C97FF',
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
    colour: '#4C97FF',
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
    colour: '#4C97FF',
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
          ['J1', 'J1'], ['J2', 'J2'], ['J3', 'J3'], ['J4', 'J4']
        ] 
      },
      { type: 'input_value', name: 'VALUE', check: 'Number' },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#4C97FF',
  },
  {
    type: 'microbit_led_pin',
    message0: 'LED %1 %2',
    args0: [
      { 
        type: 'field_dropdown', 
        name: 'PIN', 
        options: [['J1', 'J1'], ['J2', 'J2'], ['J3', 'J3'], ['J4', 'J4']] 
      },
      { 
        type: 'field_dropdown', 
        name: 'STATE', 
        options: [['ON', '1'], ['OFF', '0']] 
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#4C97FF',
  },
  {
    type: 'microbit_tm1637_show_number',
    message0: '4-digit display %1 show number %2',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['J1', 'J1'], ['J2', 'J2'], ['J3', 'J3'], ['J4', 'J4']] },
      { type: 'input_value', name: 'VALUE', check: 'Number' },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#4C97FF',
  },
  {
    type: 'microbit_set_motor',
    message0: 'set motor %1 %2 speed %3',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['M1', 'M1'], ['M2', 'M2'], ['M3', 'M3'], ['M4', 'M4']] },
      { type: 'field_dropdown', name: 'DIRECTION', options: [['FD', 'FORWARD'], ['BK', 'BACKWARD']] },
      { type: 'input_value', name: 'SPEED', check: 'Number' },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#4C97FF',
  },
  {
    type: 'microbit_stop_motor',
    message0: 'stop motor %1',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['M1', 'M1'], ['M2', 'M2'], ['M3', 'M3'], ['M4', 'M4']] },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#4C97FF',
  },
  {
    type: 'microbit_set_servo',
    message0: 'Servo %1 angle %2',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['S1', 'S1'], ['S2', 'S2'], ['S3', 'S3'], ['S4', 'S4']] },
      { type: 'input_value', name: 'ANGLE', check: 'Number' },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#4C97FF',
  },
  {
    type: 'microbit_ultrasonic_distance',
    message0: 'Ultrasonic sensor %1 distance',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['J1', 'J1'], ['J2', 'J2'], ['J3', 'J3'], ['J4', 'J4']] },
    ],
    output: 'Number',
    colour: '#9966FF',
  },
  {
    type: 'microbit_color_sensor',
    message0: 'Color sensor %1 color',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['I1', 'I1'], ['I2', 'I2'], ['I3', 'I3'], ['I4', 'I4']] },
    ],
    output: 'String',
    colour: '#9966FF',
  },
  {
    type: 'microbit_light_sensor',
    message0: 'Light sensor %1 value',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['J1', 'J1'], ['J2', 'J2']] },
    ],
    output: 'Number',
    colour: '#9966FF',
  },
  {
    type: 'microbit_temperature_sensor',
    message0: 'Temperature sensor %1 value',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['J1', 'J1'], ['J2', 'J2'], ['J3', 'J3'], ['J4', 'J4'], ['I1', 'I1'], ['I2', 'I2'], ['I3', 'I3'], ['I4', 'I4']] },
    ],
    output: 'Number',
    colour: '#9966FF',
  },
  {
    type: 'microbit_dht11',
    message0: 'DHT11 %1 %2 value',
    args0: [
      { 
        type: 'field_dropdown', 
        name: 'MODE', 
        options: [
          ['Temperature', 'TEMP'],
          ['Humidity', 'HUM']
        ] 
      },
      { 
        type: 'field_dropdown', 
        name: 'PORT', 
        options: [['J1', 'J1'], ['J2', 'J2']] 
      },
    ],
    output: 'Number',
    colour: '#9966FF',
  },
  {
    type: 'microbit_soil_moisture',
    message0: 'Soil Moisture sensor %1 value',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['J1', 'J1'], ['J2', 'J2'], ['J3', 'J3'], ['J4', 'J4']] },
    ],
    output: 'Number',
    colour: '#9966FF',
  },
  {
    type: 'microbit_potentiometer',
    message0: 'Potentiometer %1 value',
    args0: [
      { type: 'field_dropdown', name: 'PORT', options: [['J1', 'J1'], ['J2', 'J2'], ['J3', 'J3'], ['J4', 'J4']] },
    ],
    output: 'Number',
    colour: '#9966FF',
  },
  {
    type: 'microbit_ledgraph',
    message0: 'show graph %1 max %2',
    args0: [
      { type: 'input_value', name: 'VALUE', check: 'Number' },
      { type: 'input_value', name: 'MAX', check: 'Number' },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#4C97FF',
  },
  {
    type: 'microbit_play_tone',
    message0: 'play tone %1',
    args0: [
      { type: 'input_value', name: 'TONE', check: 'Number' },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#4C97FF',
  },
  {
    type: 'event_when_green_flag_clicked',
    message0: 'when %1 clicked',
    args0: [
      {
        type: 'field_image',
        src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iNDBweCIgdmlld0JveD0iMCAtOTYwIDk2MCA5NjAiIHdpZHRoPSI0MHB4IiBmaWxsPSIjMkU3RDMyIj48cGF0aCBkPSJNMjAwLTEyMHYtNjgwaDM2MGwxNiA4MGgyMjR2NDAwSDUyMGwtMTYtODBIMjgwdjI4MGgtODBaIi8+PC9zdmc+',
        width: 29,
        height: 29,
        alt: 'Green Flag'
      }
    ],
    nextStatement: null,
    colour: '#FFBF00',
    hat: 'cap',
  },
  {
    type: 'event_broadcast',
    message0: 'broadcast message %1 %2',
    args0: [
      { type: 'field_dropdown', name: 'SHAPE', options: SHAPE_OPTIONS },
      { type: 'field_dropdown', name: 'COLOR', options: COLOR_OPTIONS },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#FFBF00',
  },
  {
    type: 'event_when_received',
    message0: 'when message %1 %2 received',
    args0: [
      { type: 'field_dropdown', name: 'SHAPE', options: SHAPE_OPTIONS },
      { type: 'field_dropdown', name: 'COLOR', options: COLOR_OPTIONS },
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
    type: 'logic_boolean',
    message0: '%1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'BOOL',
        options: [
          ['true', 'TRUE'],
          ['false', 'FALSE']
        ]
      }
    ],
    output: 'Boolean',
    colour: '#59C059'
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
    inputsInline: true,
    output: 'Boolean',
    colour: '#59C059'
  },
  {
    type: 'text',
    message0: '" %1 "',
    args0: [
      {
        type: 'field_input',
        name: 'TEXT',
        text: '',
      },
    ],
    output: 'String',
    colour: '#59C059',
  },
  {
    type: 'microbit_blink_led',
    message0: 'Blink LED %1 %2 times',
    args0: [
      { type: 'field_dropdown', name: 'PIN', options: [['J1', 'J1'], ['J2', 'J2'], ['J3', 'J3'], ['J4', 'J4']] },
      { type: 'field_number', name: 'TIMES', value: 3 },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '#4C97FF',
  },
];

// Register blocks individually with error catching to prevent one failure from breaking the whole category
microbitBlocks.forEach(block => {
  try {
    Blockly.defineBlocksWithJsonArray([block]);
  } catch (e) {
    console.error(`Failed to register block: ${block.type}`, e);
  }
});

// Ensure math_number is available even if tree-shaking removed it from blockly/blocks
if (!Blockly.Blocks['math_number']) {
  Blockly.Blocks['math_number'] = {
    init: function() {
      this.jsonInit({
        "type": "math_number",
        "message0": "%1",
        "args0": [{
          "type": "field_number",
          "name": "NUM",
          "value": 0
        }],
        "output": "Number",
        "helpUrl": "%{BKY_MATH_NUMBER_HELPURL}",
        "colour": "%{BKY_MATH_HUE}",
        "tooltip": "%{BKY_MATH_NUMBER_TOOLTIP}",
        "extensions": ["parent_tooltip_when_inline"]
      });
    }
  };
}
