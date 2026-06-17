import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule }       from 'primeng/card';
import { InputTextModule }  from 'primeng/inputtext';
import { PasswordModule }   from 'primeng/password';
import { ButtonModule }     from 'primeng/button';
import { MessageModule }    from 'primeng/message';
import { FloatLabelModule } from 'primeng/floatlabel';

import { AuthService }  from 'app/core/services/auth/auth.service';
import { AuthSignInRequest } from 'app/core/interfaces/auth/auth.interface';
import { firstValueFrom }   from 'rxjs';

interface SignInForm {
  employee_Code: FormControl<string>;
  password:      FormControl<string>;
  company_Code:  FormControl<string>;
}

@Component({
  selector: 'opera-sign-in',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule, InputTextModule, PasswordModule,
    ButtonModule, MessageModule, FloatLabelModule,
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
})
export class SignInComponent implements OnInit {
  private readonly _authService = inject(AuthService);
  private readonly _router      = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMsg  = signal('');

  readonly form = new FormGroup<SignInForm>({
    employee_Code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password:      new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    company_Code:  new FormControl('IMHON', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    // Si ya está autenticado, ir al dashboard directamente
    if (this._authService.accessToken) {
      this._router.navigate(['/dashboard']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set('');

    const credentials: AuthSignInRequest = this.form.getRawValue();

    const response = await firstValueFrom(this._authService.signIn$(credentials));
    this.isLoading.set(false);

    if (response.success) {
      this._router.navigate(['/dashboard']);
    } else {
      this.errorMsg.set(response.errorMessage ?? 'Credenciales incorrectas. Intente nuevamente.');
    }
  }
}
