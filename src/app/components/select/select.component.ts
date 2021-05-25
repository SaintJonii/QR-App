import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { AngularFirestore } from "@angular/fire/firestore";

import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent implements OnInit {

  @Input() disabled;
  @Output() userSelected = new EventEmitter<any>();
  users: any = [] ;
  constructor(private auth: AuthService, private afs: AngularFirestore, public actionSheetController: ActionSheetController) { }

  async ngOnInit() {
    this.getUsers();
   }

  onChange(e) {
    let id = e;
    let user = this.users.find(x => x.id == id);
    this.userSelected.emit(user);
  }

  getUsers() {
    const doc1 = this.afs.collection('users',
      ref => ref.orderBy('id', 'asc')
    );

    doc1.valueChanges()
      .subscribe(data => {
        this.users = data;
      });
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Usuarios',
      cssClass: 'my-custom-class',
      animated: true,
      buttons: [{
        text: 'Admin',
        icon: 'key',
        handler: () => {
          this.onChange("1");
        }
      }, {
        text: 'Invitado',
        icon: 'ticket',
        handler: () => {
          this.onChange("2");
        }
      }, {
        text: 'Usuario',
        icon: 'person',
        handler: () => {
          this.onChange("3");
        }
      }, {
        text: 'Anonimo',
        icon: 'help',
        handler: () => {
          this.onChange("4");
        }
      }, {
        text: 'Tester',
        icon: 'bug',
        handler: () => {
          this.onChange("5");
        }
      }]
    });
    await actionSheet.present();

    const { role } = await actionSheet.onDidDismiss();
    console.log('onDidDismiss resolved with role', role);
  }

}
