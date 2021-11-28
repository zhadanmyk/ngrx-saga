import { Action } from '@ngrx/store';
import { Observable, isObservable } from 'rxjs';
import { first } from 'rxjs/operators';

export class ActionWrapper {
  constructor(readonly action: Action) {}
}

export function put<T extends Action>(action: T): ActionWrapper {
  return new ActionWrapper(action);
}

export type ActionGenerator = (initialAction: Action) => Generator;

export function fromGenerator(
  generator: ActionGenerator
): (initialAction: Action) => Observable<Action> {
  return (initialAction) => {
    return new Observable<Action>((sub) => {
      // Create the generator and kick off the first iteration
      const gen = generator(initialAction);
      next(undefined);

      // Handle each iteration
      function next(nextValue: unknown): void {
        try {
          const { value, done } = gen.next(nextValue);
          if (done) {
            // We are done
            sub.complete();
            return;
          }
          if (value instanceof ActionWrapper) {
            sub.next(value.action);
            setTimeout(() => next(value.action));
          } else if (isObservable(value)) {
            value.pipe(first()).subscribe(next, (e) => sub.error(e));
          } else if (isPromise(value)) {
            value.then(next, (e) => sub.error(e));
          } else {
            setTimeout(() => next(value));
          }
        } catch (error) {
          sub.error(error);
        }
      }
    });
  };
}

function isPromise<T>(promise: any): promise is Promise<T> {
  return !!promise && typeof promise.then === 'function';
}
