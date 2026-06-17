import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserLogged } from 'app/core/interfaces/auth/auth.interface';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _user$ = new BehaviorSubject<UserLogged | null>(null);

  get user$(): Observable<UserLogged | null> {
    return this._user$.asObservable();
  }

  get user(): UserLogged | null {
    return this._user$.value;
  }

  set user(value: UserLogged) {
    this._user$.next(value);
  }

  clear(): void {
    this._user$.next(null);
  }
}
