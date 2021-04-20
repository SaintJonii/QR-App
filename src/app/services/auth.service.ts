import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  authState = null;

  constructor(private auth: AngularFireAuth, public router: Router) {
    this.auth.authState.subscribe(state => {
      console.log(state);
      this.authState = state;
    });
   }

   loginUser(email: string, password: string) {
    this.auth.signInWithEmailAndPassword(email, password)
      .then(async resp => {

        await this.auth.currentUser.then(async token => {
          this.router.navigateByUrl('home');
        });
      }).catch(function(e) {
        alert("Usuario invalido");
      });
  }
}
