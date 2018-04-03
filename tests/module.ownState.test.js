import {cloneDeep} from "lodash";

import {unlinkStore, RMCCtl} from "../src";
import {getActionCreator, creator} from "./helpers";

const VALID_CLASS = class SCtl extends RMCCtl {
  _stateDidUpdate() {}
};
const MODULE_REDUCER = () => {
  return {
    name: "initial",
  };
};

afterEach(() => {
  unlinkStore();
});

describe("module.ownState", () => {
  describe("for getting data", () => {
    it("should be accessible from outside", () => {
      const ownState = {
        foo: "bar",
        bar: "foo",
      };
      const expected = cloneDeep(ownState);
      const reducer = (state = {}, action) => {
        return ownState;
      };
      const module = creator(reducer, VALID_CLASS);

      expect(module.ownState).toEqual(expected);
    });

    it("should be accessible from inside of controller`s method", () => {
      const ownState = {
        foo: "bar",
        bar: "foo",
      };
      const expected = cloneDeep(ownState);
      const reducer = (state = {}, action) => {
        return ownState;
      };
      class Ctl extends VALID_CLASS {
        getOwnState() {
          return this.ownState;
        }
      }
      const module = creator(reducer, Ctl);

      expect(module.getOwnState()).toEqual(expected);
    });

    it("should be accessible from inside of the `_stateDidUpdate` method", () => {
      const actionCreator = getActionCreator();
      const someFunc = jest.fn();
      const ownState = {
        foo: "bar",
        bar: "foo",
      };
      const expected = cloneDeep(ownState);
      function reducer(state = {}, action) {
        switch (action.type) {
          case actionCreator.type:
            return action.payload;

          default:
            return state;
        }
      }
      class Ctl extends VALID_CLASS {
        _stateDidUpdate() {
          someFunc(this.ownState);
        }
      }
      const module = creator(reducer, Ctl);

      module.dispatch(actionCreator(ownState));

      expect(someFunc).toHaveBeenCalledWith(expected);
    });
  });

  describe("for setting whole state", () => {
    it("shouldn`t be accessible from outside", () => {
      const module = creator(MODULE_REDUCER, VALID_CLASS);

      expect(() => {
        module.ownState = {};
      }).toThrow();
    });

    it("shouldn`t be accessible from inside of controller`s method", () => {
      class Ctl extends VALID_CLASS {
        someMethod() {
          this.ownState = {};
        }
      }
      const module = creator(MODULE_REDUCER, Ctl);

      expect(() => {
        module.someMethod();
      }).toThrow();
    });

    it("shouldn`t be accessible from inside of the `_stateDidUpdate` method", () => {
      const actionCreator = getActionCreator();
      function reducer(state = {}, action) {
        switch (action.type) {
          case actionCreator.type:
            return action.payload;

          default:
            return state;
        }
      }
      class Ctl extends VALID_CLASS {
        _stateDidUpdate() {
          this.ownState = {};
        }
      }
      const module = creator(reducer, Ctl);

      expect(() => {
        module.dispatch(actionCreator());
      }).toThrow();
    });
  });

  describe("for setting a part of the state", () => {
    it("shouldn`t be accessible from outside", () => {
      const ownState = {
        foo: {
          bar: "foo",
        },
      };
      const expected = cloneDeep(ownState);
      function reducer(state = {}, action) {
        return ownState;
      }
      const module = creator(reducer, VALID_CLASS);

      module.ownState.foo = {};

      expect(module.ownState).toEqual(expected);
    });

    it("shouldn`t be accessible from inside of controller`s method", () => {
      const ownState = {
        foo: {
          bar: "foo",
        },
      };
      const expected = cloneDeep(ownState);
      function reducer(state = {}, action) {
        return ownState;
      }
      class Ctl extends VALID_CLASS {
        someMethod() {
          this.ownState.foo = {};
        }
      }
      const module = creator(reducer, Ctl);

      module.someMethod();

      expect(module.ownState).toEqual(expected);
    });

    it("shouldn`t be accessible from inside of the `_stateDidUpdate` method", () => {
      const actionCreator = getActionCreator();
      const ownState = {
        foo: {
          bar: "foo",
        },
      };
      const expected = cloneDeep(ownState);
      function reducer(state = {}, action) {
        return ownState;
      }
      class Ctl extends VALID_CLASS {
        _stateDidUpdate() {
          this.ownState.foo = {};
        }
      }
      const module = creator(reducer, Ctl);

      module.dispatch(actionCreator());

      expect(module.ownState).toEqual(expected);
    });
  });
});
