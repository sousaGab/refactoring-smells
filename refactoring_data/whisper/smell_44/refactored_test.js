// @flow
import { warning } from '../../src/dev-warning';

const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

afterEach(() => {
  warn.mockClear();
});

it('should log a warning to the console', () => {
  warning('hey');

  expect(warn).toHaveBeenCalled();
});

it('should toggle warning behavior based on disable flag', () => {
  // Disable warnings and verify no warnings are logged
  window['__react-beautiful-dnd-disable-dev-warnings'] = true;

  warning('hey');
  warning('sup'); 
  warning('hi');

  expect(warn).not.toHaveBeenCalled();

  // Re-enable warnings and verify they are logged
  window['__react-beautiful-dnd-disable-dev-warnings'] = false;

  warning('hey');

  expect(warn).toHaveBeenCalled();
});
