import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, createAction, props } from '@ngrx/store';
import { switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { UsersService, User } from './services/users.service';
import { PostsService, Post } from './services/posts.service';
import { fromGenerator, put } from './from-action-gen';

export const loadUser = createAction('[User] Load user');
export const loadUserSuccess = createAction(
  '[User] Load user success',
  props<{ user: User; permissions: string[] }>()
);
export const loadPostsSuccess = createAction(
  '[Posts] Load posts success',
  props<{ posts: Post[] }>()
);
export const notifyError = createAction(
  '[Notifications] Error',
  props<{ error: any }>()
);
export const showSpinner = createAction('[Spinner] Show spinner');
export const hideSpinner = createAction('[Spinner] Hide spinner');

@Injectable()
export class AppEffects {
  public initUser$: Observable<Action>;

  constructor(
    actions$: Actions,
    usersService: UsersService,
    postsService: PostsService
  ) {
    function* loadUserSaga() {
      try {
        yield put(showSpinner());

        const user = yield usersService.getUser();
        const permissions = yield usersService.getPermissions(user.id);
        yield put(loadUserSuccess({ user, permissions }));

        if (permissions.includes('posts:read')) {
          yield put(
            loadPostsSuccess({
              posts: yield postsService.getPosts(),
            })
          );
        }
      } catch (error) {
        yield put(notifyError(error));
      } finally {
        yield put(hideSpinner());
      }
    }

    this.initUser$ = createEffect(() =>
      actions$.pipe(ofType(loadUser), switchMap(fromGenerator(loadUserSaga)))
    );
  }
}
