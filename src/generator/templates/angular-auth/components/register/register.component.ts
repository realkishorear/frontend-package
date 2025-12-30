import { Component } from '@angular/core'
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms'
import { Router } from '@angular/router'
import { AuthService } from '../../services/auth.service'

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup
  error: string = ''
  loading: boolean = false

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator })
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password')
    const confirmPassword = control.get('confirmPassword')

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true }
    }

    return null
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.error = ''
      this.loading = true

      const { name, email, password } = this.registerForm.value

      this.authService.register(name, email, password).subscribe({
        next: () => {
          this.router.navigate(['/dashboard'])
        },
        error: (err) => {
          this.error = err.message || 'Failed to register. Please try again.'
          this.loading = false
        }
      })
    }
  }

  onOAuthRegister(provider: 'google' | 'github' | 'twitter') {
    this.error = ''
    this.loading = true

    // TODO: Replace with your OAuth backend integration
    // Example: window.location.href = `/api/auth/${provider}`
    console.log(`OAuth register with ${provider}`)
    alert(`OAuth registration with ${provider} - Backend integration needed`)
    this.loading = false
  }
}

