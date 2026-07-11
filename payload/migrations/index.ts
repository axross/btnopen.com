import * as migration_20260321_020224 from './20260321_020224';
import * as migration_20260321_064820 from './20260321_064820';
import * as migration_20260321_080250 from './20260321_080250';
import * as migration_20260323_025814 from './20260323_025814';
import * as migration_20260527_230752 from './20260527_230752';
import * as migration_20260531_234538 from './20260531_234538';
import * as migration_20260601_040708 from './20260601_040708';
import * as migration_20260711_033544 from './20260711_033544';
import * as migration_20260711_225536_schema_agentic_fields from './20260711_225536_schema_agentic_fields';

export const migrations = [
  {
    up: migration_20260321_020224.up,
    down: migration_20260321_020224.down,
    name: '20260321_020224',
  },
  {
    up: migration_20260321_064820.up,
    down: migration_20260321_064820.down,
    name: '20260321_064820',
  },
  {
    up: migration_20260321_080250.up,
    down: migration_20260321_080250.down,
    name: '20260321_080250',
  },
  {
    up: migration_20260323_025814.up,
    down: migration_20260323_025814.down,
    name: '20260323_025814',
  },
  {
    up: migration_20260527_230752.up,
    down: migration_20260527_230752.down,
    name: '20260527_230752',
  },
  {
    up: migration_20260531_234538.up,
    down: migration_20260531_234538.down,
    name: '20260531_234538',
  },
  {
    up: migration_20260601_040708.up,
    down: migration_20260601_040708.down,
    name: '20260601_040708',
  },
  {
    up: migration_20260711_033544.up,
    down: migration_20260711_033544.down,
    name: '20260711_033544',
  },
  {
    up: migration_20260711_225536_schema_agentic_fields.up,
    down: migration_20260711_225536_schema_agentic_fields.down,
    name: '20260711_225536_schema_agentic_fields'
  },
];
