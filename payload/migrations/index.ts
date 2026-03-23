import * as migration_20260321_020224 from './20260321_020224';
import * as migration_20260321_064820 from './20260321_064820';
import * as migration_20260321_080250 from './20260321_080250';
import * as migration_20260323_025814 from './20260323_025814';

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
    name: '20260323_025814'
  },
];
