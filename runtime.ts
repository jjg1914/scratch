/// <reference path="./typings/es6-promise/es6-promise.d.ts"/>

export type RuntimeCallback = (event: any) => void;
export type RuntimeImpl = (cb: RuntimeCallback) => void;

export interface Runable<T> {
  run(any): T;
}

export class Runtime<T extends Runable<T>> {
  constructor(initial: T, f: RuntimeImpl) {
    f((event: any) => {
      let temp: T = this.state.run(event);

      if (temp instanceof this.state.prototype.constructor) {
        this.state = temp;
      } else if (temp instanceof IO) {
        temp.run(() => this.state, (t: T) => this.state = t, (t: T) => this.state = t);
      }
    })
  }

  private state: T;
}

/**
 * Call signature of an impure procedure. Procedure may obtain the current
 * value of some state using the ```get``` procedure (Call as many times as
 * needed, result not expected to be the same between calls). It may update the
 * current state using the ```set``` procedure as many times as needed.
 * Finally, the procedure must call the ```cb``` procedure **once** to
 * signal completion.
 */
export type IOImpl<T> =
  (get: () => T, set: (t: T) => void, cb: (t: T) => void) => void;

/**
 * Implemenation of an IO Monad. Wraps an impure procedure to be executed by
 * the runtime.
 */
export class IO<T> {
  constructor(f: IOImpl<T>) {
    this._f = f;
  }

  bind(f: (t: T) => IO<T>): IO<T> {
    return new IO((get: () => T, set: (t: T) => void, cb: (t: T) => void) => {
      this._f(get, set, (t: T) => f(t).run(get, set, cb));
    });
  }

  map(f: (t: T) => T): IO<T> {
    return new IO((get: () => T, set: (t: T) => void, cb: (t: T) => void) => {
      this._f(get, set, (t: T) => cb(f(t)));
    });
  }

  run(get: () => T, set: (t: T) => void, cb: (t: T) => void): void {
    this._f(get, set, cb);
  }

  private _f: IOImpl<T>;
}

/**
 * Create an IO Monad that writes a value to the state.
 */
export function Put<T>(t: T): IO<T> {
  return new IO((get: () => T, set: (t: T) => void, cb: (t: T) => void) => {
    set(t);
    cb(t);
  });
}

export function Get<T>(): IO<T> {
  return new IO((get: () => T, set: (t: T) => void, cb: (t: T) => void) => {
    cb(get());
  });
}

export function Delay<T>(n: Number): IO<T> {
  return new IO((get: () => T, set: (t: T) => void, cb: (t: T) => void) => {
    setTimeout(() => cb(get()), n);
  });
}
