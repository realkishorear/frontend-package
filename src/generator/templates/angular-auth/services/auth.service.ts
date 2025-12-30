import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { BehaviorSubject, Observable, of, throwError } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth' // TODO: Replace with your backend API URL
  private currentUserSubject = new BehaviorSubject<User | null>(null)
  public currentUser$ = this.currentUserSubject.asObservable()

  constructor(private http: HttpClient) {
    this.initializeAuth()
  }

  private initializeAuth() {
    // TODO: Replace with your backend token validation
    // Check localStorage for token and validate with backend
    const token = localStorage.getItem('authToken')
    
    if (token) {
      // TODO: Validate token with backend
      // this.http.get<User>(`${this.apiUrl}/validate`).subscribe({
      //   next: (user) => this.currentUserSubject.next(user),
      //   error: () => {
      //     localStorage.removeItem('authToken')
      //     localStorage.removeItem('user')
      //   }
      // })
      
      // Placeholder - replace with actual backend call
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser))
      }
    }
  }

  login(email: string, password: string): Observable<User> {
    // TODO: Replace with your backend API call
    // return this.http.post<{ user: User; token: string }>(`${this.apiUrl}/login`, {
    //   email,
    //   password
    // }).pipe(
    //   tap((response) => {
    //     localStorage.setItem('authToken', response.token)
    //     localStorage.setItem('user', JSON.stringify(response.user))
    //     this.currentUserSubject.next(response.user)
    //   }),
    //   map((response) => response.user),
    //   catchError((error) => {
    //     return throwError(() => new Error(error.error?.message || 'Login failed'))
    //   })
    // )

    // Placeholder implementation - replace with actual backend
    return of({
      id: '1',
      name: 'John Doe',
      email: email
    } as User).pipe(
      tap((user) => {
        const dummyToken = 'dummy-jwt-token-' + Date.now()
        localStorage.setItem('authToken', dummyToken)
        localStorage.setItem('user', JSON.stringify(user))
        this.currentUserSubject.next(user)
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message || 'Login failed'))
      })
    )
  }

  register(name: string, email: string, password: string): Observable<User> {
    // TODO: Replace with your backend API call
    // return this.http.post<{ user: User; token: string }>(`${this.apiUrl}/register`, {
    //   name,
    //   email,
    //   password
    // }).pipe(
    //   tap((response) => {
    //     localStorage.setItem('authToken', response.token)
    //     localStorage.setItem('user', JSON.stringify(response.user))
    //     this.currentUserSubject.next(response.user)
    //   }),
    //   map((response) => response.user),
    //   catchError((error) => {
    //     return throwError(() => new Error(error.error?.message || 'Registration failed'))
    //   })
    // )

    // Placeholder implementation - replace with actual backend
    return of({
      id: '1',
      name: name,
      email: email
    } as User).pipe(
      tap((user) => {
        const dummyToken = 'dummy-jwt-token-' + Date.now()
        localStorage.setItem('authToken', dummyToken)
        localStorage.setItem('user', JSON.stringify(user))
        this.currentUserSubject.next(user)
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message || 'Registration failed'))
      })
    )
  }

  logout(): Observable<void> {
    // TODO: Replace with your backend API call for logout
    // return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
    //   tap(() => {
    //     localStorage.removeItem('authToken')
    //     localStorage.removeItem('refreshToken')
    //     localStorage.removeItem('user')
    //     this.currentUserSubject.next(null)
    //   }),
    //   catchError((error) => {
    //     // Clear local storage even if API call fails
    //     localStorage.removeItem('authToken')
    //     localStorage.removeItem('refreshToken')
    //     localStorage.removeItem('user')
    //     this.currentUserSubject.next(null)
    //     return throwError(() => error)
    //   })
    // )

    // Placeholder implementation
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    this.currentUserSubject.next(null)
    return of(void 0)
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value
  }

  refreshToken(): Observable<string> {
    // TODO: Replace with your backend token refresh endpoint
    // const refreshToken = localStorage.getItem('refreshToken')
    // return this.http.post<{ token: string }>(`${this.apiUrl}/refresh`, {
    //   refreshToken
    // }).pipe(
    //   tap((response) => {
    //     localStorage.setItem('authToken', response.token)
    //   }),
    //   map((response) => response.token),
    //   catchError((error) => {
    //     this.logout()
    //     return throwError(() => error)
    //   })
    // )

    // Placeholder
    console.log('Token refresh - Backend integration needed')
    return throwError(() => new Error('Token refresh not implemented'))
  }
}

