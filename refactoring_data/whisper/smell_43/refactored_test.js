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

it('should handle warning behavior based on disable flag', () => {
  // Test when warnings are disabled
  window['__react-beautiful-dnd-disable-dev-warnings'] = true;

  warning('hey');
  warning('sup'); 
  warning('hi');

  expect(warn).not.toHaveBeenCalled();

  // Test when warnings are re-enabled
  window['__react-beautiful-dnd-disable-dev-warnings'] = false;

  warning('hey');
  expect(warn).toHaveBeenCalledTimes(1);
});
