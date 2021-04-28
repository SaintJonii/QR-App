import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { AngularFirestore } from "@angular/fire/firestore";

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent implements OnInit {

  @Input() disabled;
  @Output() userSelected = new EventEmitter<any>();
  users: any = [] ;
  constructor(private auth: AuthService, private afs: AngularFirestore) { }

  async ngOnInit() {
    this.getUsers();
   }

  onChange(e) {
    let id = e.target.value;
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

}
