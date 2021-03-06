import {allValuesTypes, testAllValues} from 'unit-tests-values-iterators';

import {InvalidParamsError, DuplicateError} from '../src/lib/baseErrors';
import {getActionCreator} from './helpers';

import {unlinkStore, createModule, RMCCtl} from '../src';

const VALID_CLASS = class SCtl extends RMCCtl {};
const MODULE_REDUCER = () => {
  return {
    name: 'initial',
  };
};

describe('createModule', () => {
  afterEach(() => {
    try {
      unlinkStore();
    } catch (e) {}
  });

  it('should throw an error if valid params is supplied as separate arguments', () => {
    const actionCreator = getActionCreator();

    expect(() => {
      createModule(VALID_CLASS, MODULE_REDUCER, {action0: {creator: actionCreator, type: actionCreator.type}});
    }).toThrow(InvalidParamsError);
  });

  testAllValues((ctl, type) => {
    it(`should throw an error if a controller is not inherited from the RMCCtl: "${ctl}" of type "${type}"`, () => {
      expect(() => {
        createModule({Ctl: ctl, reducer: MODULE_REDUCER});
      }).toThrow(InvalidParamsError);
    });
  });

  testAllValues(
    (ctlParams, type) => {
      it(`should throw an error if a controllers params is not an array: "${ctlParams}" of type "${type}"`, () => {
        expect(() => {
          createModule({Ctl: VALID_CLASS, ctlParams, reducer: MODULE_REDUCER});
        }).toThrow(InvalidParamsError);
      });
    },
    {
      exclude: [allValuesTypes.ARRAY, allValuesTypes.UNDEFINED],
    }
  );

  it('should not throw an error if a controller passed with params', () => {
    const ctlParams = ['foo', true];
    class SCtl extends RMCCtl {
      constructor(str, bool, ...rest) {
        super(...rest);
      }
    }

    expect(() => {
      createModule({Ctl: SCtl, ctlParams, reducer: MODULE_REDUCER});
    }).not.toThrow();
  });

  testAllValues(
    (reducer, type) => {
      it(`should throw an error if a reducer is not a function: "${reducer}" of type "${type}"`, () => {
        expect(() => {
          createModule({Ctl: VALID_CLASS, reducer});
        }).toThrow(InvalidParamsError);
      });
    },
    {exclude: [allValuesTypes.FUNCTION]}
  );

  testAllValues(
    (actions, type) => {
      it(`should throw an error if actions is not an object: "${actions}" of type "${type}"`, () => {
        expect(() => {
          createModule({Ctl: VALID_CLASS, reducer: MODULE_REDUCER, actions});
        }).toThrow(InvalidParamsError);
      });
    },
    {exclude: [allValuesTypes.PLAIN_OBJECT, allValuesTypes.ARRAY, allValuesTypes.UNDEFINED]}
  );

  testAllValues(
    (creator, creatorType) => {
      testAllValues(
        (type, actionTypeType) => {
          const creatorString = `creator: ${creator} of type ${creatorType};`;
          const typeString = `type: ${type} of type ${actionTypeType};`;

          it(`should throw an error if some action has wrong creator or type; ${creatorString} ${typeString}`, () => {
            expect(() => {
              createModule({
                Ctl: VALID_CLASS,
                reducer: MODULE_REDUCER,
                actions: {
                  action0: {creator, type},
                },
              });
            }).toThrow(InvalidParamsError);
          });
        },
        {exclude: [allValuesTypes.STRING]}
      );
    },
    {exclude: [allValuesTypes.FUNCTION, allValuesTypes.UNDEFINED]}
  );

  testAllValues(
    (proxy, type) => {
      it(`should throw an error if some action has wrong proxy: ${proxy} of type ${type}`, () => {
        expect(() => {
          createModule({
            Ctl: VALID_CLASS,
            reducer: MODULE_REDUCER,
            actions: {
              action0: {proxy},
            },
          });
        }).toThrow(InvalidParamsError);
      });
    },
    {exclude: [allValuesTypes.FUNCTION]}
  );

  testAllValues(
    (creatorName, type) => {
      it(`should throw an error if some action has wrong proxy creatorName: ${creatorName} of type ${type}`, () => {
        expect(() => {
          createModule({
            Ctl: VALID_CLASS,
            reducer: MODULE_REDUCER,
            actions: {
              action0: {proxy: getActionCreator(), creatorName},
            },
          });
        }).toThrow(InvalidParamsError);
      });
    },
    {exclude: [allValuesTypes.STRING, allValuesTypes.UNDEFINED]}
  );

  it('should not throw an error if action has not a creator', () => {
    expect(() => {
      createModule({
        Ctl: VALID_CLASS,
        reducer: MODULE_REDUCER,
        actions: {
          action0: {
            type: 'type',
          },
        },
      });
    }).not.toThrow();
  });

  it('should not throw an error if action has a correct creator and a type', () => {
    expect(() => {
      const actionCreator = getActionCreator();

      createModule({
        Ctl: VALID_CLASS,
        reducer: MODULE_REDUCER,
        actions: {
          action0: {
            creator: actionCreator,
            type: actionCreator.type,
          },
        },
      });
    }).not.toThrow();
  });

  it('should not throw an error if action has a correct proxy', () => {
    expect(() => {
      createModule({
        Ctl: VALID_CLASS,
        reducer: MODULE_REDUCER,
        actions: {
          action0: {
            proxy: getActionCreator(),
          },
        },
      });
    }).not.toThrow();
  });

  it('should throw an error if a creatorName for a proxy is similar with a module`s method', () => {
    class SampleCtl extends RMCCtl {
      method0() {}
    }

    expect(() => {
      createModule({
        Ctl: SampleCtl,
        reducer: MODULE_REDUCER,
        actions: {
          action0: {
            proxy: getActionCreator(),
            creatorName: 'method0',
          },
        },
      });
    }).toThrow();
  });

  it('should pass the controller params into the controller constructor before the actions', () => {
    const param0 = 'foo';
    const param1 = 1;
    const param2 = false;
    const ctlParams = [param0, param1, param2];
    const spy = jest.fn();

    class Ctl extends RMCCtl {
      constructor(param0, param1, param2, ...rest) {
        super(...rest);

        spy(param0, param1, param2);
      }
    }
    createModule({Ctl, ctlParams, reducer: MODULE_REDUCER});

    expect(spy).toHaveBeenCalledWith(...ctlParams);
  });

  it('should not throw an error if ctl class doesn`t have `_stateDidUpdate` method', () => {
    class Ctl extends RMCCtl {}

    expect(() => {
      createModule({Ctl, reducer: () => {}});
    }).not.toThrow();
  });

  it('should fire a warning if a controller has a same named method or property with Module', () => {
    class Ctl extends VALID_CLASS {
      integrator() {}
    }

    const warning = jest.spyOn(console, 'warn');

    createModule({Ctl, reducer: () => {}});

    expect(warning).toHaveBeenCalled();
  });

  it('should throw an error if a controller has a same named private method or property with Module', () => {
    class Ctl extends VALID_CLASS {
      __initializeMdl() {}
    }

    expect(() => {
      createModule({Ctl, reducer: () => {}});
    }).toThrow(DuplicateError);
  });

  it('should return object with method integrator', () => {
    const module = createModule({Ctl: VALID_CLASS, reducer: () => {}});

    expect(module.integrator).toEqual(expect.any(Function));
  });

  it('should return different object on each call', () => {
    const reducer = () => {};

    const module0 = createModule({Ctl: VALID_CLASS, reducer});
    const module1 = createModule({Ctl: VALID_CLASS, reducer});

    expect(module0).not.toBe(module1);
  });
});
