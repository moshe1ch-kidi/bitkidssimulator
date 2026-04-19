import * as Blockly from 'blockly';
import 'blockly/blocks';
import { FieldColour } from '@blockly/field-colour';
import { FieldSlider } from '@blockly/field-slider';

// רישום השדות התקינים
Blockly.fieldRegistry.register('field_colour', FieldColour);
Blockly.fieldRegistry.register('field_slider', FieldSlider);

/**
 * תיקון עבור FieldBitmap:
 * מכיוון שהחבילה החיצונית שבורה ב-Blockly 12, אנחנו יוצרים גרסה בסיסית
 * כדי למנוע שגיאות הרצה (Runtime Errors)
 */
class SimpleFieldBitmap extends Blockly.Field {
  static fromJson(options: any) {
    return new SimpleFieldBitmap(options['value']);
  }
  constructor(value: any) {
    super(value);
  }
  override getText() { return "LEDs"; }
}
Blockly.fieldRegistry.register('field_bitmap', SimpleFieldBitmap);

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

const SHAPE_OPTIONS = [
  [{ src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>', width: 20, height: 20, alt: 'Star' }, 'STAR'],
  [{ src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>', width: 20, height: 20, alt: 'Heart' }, 'HEART'],
  [{ src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>', width: 20, height: 20, alt: 'Circle' }, 'CIRCLE'],
  [{ src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>', width: 20, height: 20, alt: 'Square' }, 'SQUARE'],
];

const COLOR_OPTIONS = [
  [{ src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="red"/></svg>', width: 20, height: 20, alt: 'Red' }, 'RED'],
  [{ src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="green"/></svg>', width: 20, height: 20, alt: 'Green' }, 'GREEN'],
  [{ src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="blue"/></svg>', width: 20, height: 20, alt: 'Blue' }, 'BLUE'],
  [{ src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="yellow"/></svg>', width: 20, height: 20, alt: 'Yellow' }, 'YELLOW'],
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
      { type: 'field_
