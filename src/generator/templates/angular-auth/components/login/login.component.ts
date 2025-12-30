import { Component } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { AuthService } from '../../services/auth.service'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup
  error: string = ''
  loading: boolean = false

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    })
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.error = ''
      this.loading = true

      const { email, password } = this.loginForm.value

      this.authService.login(email, password).subscribe({
        next: () => {
          this.router.navigate(['/dashboard'])
        },
        error: (err) => {
          this.error = err.message || 'Failed to login. Please check your credentials.'
          this.loading = false
        }
      })
    }
  }

  onOAuthLogin(provider: 'google' | 'github' | 'twitter') {
    this.error = ''
    this.loading = true

    // TODO: Replace with your OAuth backend integration
    // Example: window.location.href = `/api/auth/${provider}`
    console.log(`OAuth login with ${provider}`)
    alert(`OAuth login with ${provider} - Backend integration needed`)
    this.loading = false
  }
}

