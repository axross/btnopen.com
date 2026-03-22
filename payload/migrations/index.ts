import * as migration_20260321_020224 from './20260321_020224';
import * as migration_20260321_064820 from './20260321_064820';
import * as migration_20260321_080250 from './20260321_080250';

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
    name: '20260321_080250'
  },
];
