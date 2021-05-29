import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AlertController } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
const { BarcodeScanner } = Plugins;

import * as firebase from 'firebase';
import { exit } from 'process';
import { Creditos } from '../../models/creditos';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

  result = null;
  scanActive = false;
  style= "url(../../../assets/home.png)";

  public mostrar = true;
  public creditoActual: number = 0;
  public mensajeAlerta: string = "Sin mensaje actual";
  public usuarioActual: string = "";
  public creditos: Array<Creditos> = new Array<Creditos>();
  public creditosPorUsuario: Array<Creditos>;
  encodeData: any;
  scannedData: {};
 
  constructor(private router: Router, 
             private alertController: AlertController, private authService: AuthService) {
    this.usuarioActual = localStorage.getItem('usuarioActual');
    this.obtenerDatos();

    this.freno(300).then(() => {
      this.mostrar = false;
    });
  }

  ngOnInit() {
    this.usuarioActual = localStorage.getItem('usuarioActual');
    this.obtenerDatos();
    
  }

  ngAfterViewInit(){
    BarcodeScanner.prepare();
  }

  ngOnDestroy(){
    BarcodeScanner.stopScan();
  }

  async cargarCredito() {
    const allowed = await this.checkPermisos();
    if(allowed){
      this.scanActive = true;
      BarcodeScanner.hideBackground();
      const result = await BarcodeScanner.startScan();

      if(result.content){
        this.result = result.content;
        this.scanActive = false;
        switch (this.result) { 
          case "8c95def646b6127282ed50454b73240300dccabc":
            this.ValidarCodigoUnico(new Creditos(this.usuarioActual, 10, this.result));
            break;
          case "2786f4877b9091dcad7f35751bfcf5d5ea712b2f":
            this.ValidarCodigoUnico(new Creditos(this.usuarioActual, 100, this.result));
            break;
          default: 
          this.ValidarCodigoUnico(new Creditos(this.usuarioActual, 50, this.result));
        }

      }
    }
    
  }
  
  async checkPermisos(){
    return new Promise( async (resolve, reject)=>{
      const status = await BarcodeScanner.checkPermission({ force:true });
      if(status.granted){
        resolve(true);
      }else if(status.denied){
        const alert = await  this.alertController.create({
          header: 'Sin permisos',
          message: 'Por favor active los permisos para la camara en configuraciones',
          buttons: [{
            text: 'No',
            role: 'cancel'
          },{
            text: 'Ir a configuraciones',
            handler: () =>{
              BarcodeScanner.openAppSettings();
              resolve(false);
            }
          }]
        });
        await alert.present();
      }else{
        resolve(false);
      }
    })
  }

  stopScanner(){
    BarcodeScanner.stopScan();
    this.scanActive = false;
  }

  ValidarCodigoUnico(objCredito: Creditos) {
    this.obtenerDatos();
    if (this.usuarioActual !== 'admin') {      
      
      if(this.creditos.length == 0) {
        this.guardarCredito(objCredito);
        exit();
      }
      
         this.creditos.forEach(resp => {  
         if (resp.codigo == objCredito.codigo) {
          this.CargaDuplicada('No puede cargar DOS veces el mismo código');
          exit();    
        }
      })
      this.guardarCredito(objCredito);
      exit();
      }      

      if (this.usuarioActual == 'admin') { 

        if(this.creditos.length == 0) {
          this.guardarCredito(objCredito);
          exit();
        }
        
        this.creditos.forEach(resp => {  

         if (resp.codigo == objCredito.codigo && !this.ContarCargasDeAdmin(this.creditos, resp.codigo)) {
          this.CargaDuplicada('No puede cargar TRES veces el mismo código');
          exit();
        } 
      })
      this.guardarCredito(objCredito);
      exit();
    }     
      
  }

  ContarCargasDeAdmin(creditosAdmin: Array<Creditos>, codigo:string): boolean {
    var contadorDeCargasDeCreditoAdmin = 0;
    creditosAdmin.forEach(resp => {
     
      if (resp.codigo == codigo) {
        contadorDeCargasDeCreditoAdmin += 1;
      }
    })

    if (contadorDeCargasDeCreditoAdmin >= 2) {
      return false;
    } else { 
      return true;
    }
  }


  guardarCredito(objetoCredito: Creditos) {
    var usuariosRef = firebase.default.database().ref('creditos/' + objetoCredito.usuario);
    usuariosRef.push({ usuario: objetoCredito.usuario, 
                       codigo: objetoCredito.codigo,
                       credito: objetoCredito.credito }).then(() => {                 
                       this.CargaExitosa(objetoCredito);
                       this.obtenerDatos();
                       
    }).catch(error => {
      this.CargaFallida(error.message);
    });
  
  }

  obtenerDatos() {
      this.creditos = new Array<Creditos>();
      var starCountRef = firebase.default.database().ref('creditos/' + this.usuarioActual);
      starCountRef.on('value', (snap) => {
        var data = snap.val(); 
        for(var key in data ) {
          this.creditos.push(data[key]); 
        }
      })      
    this.MostrarCargaCredito();
  }

  MostrarCargaCredito() { 
    var contadorCredito = 0;
    this.creditos.forEach(resp => {
      if (resp.usuario == this.usuarioActual) {
         contadorCredito += resp.credito;
      }

    })
    this.creditoActual = contadorCredito;
  }

  borrarCredito() {

      var usuariosRef = firebase.default.database().ref("creditos/" +  this.usuarioActual);
      usuariosRef.remove().then(resp => {
        this.creditoActual = 0;
        this.BorradoExitoso('Cargas borradas');
      });
  }

  salir() {
    //this.authService.logout();
    this.router.navigate(['/login']);
  }

  async freno(ms: number) {
    await new Promise(resolve => setTimeout(() => resolve(), ms)).then(() => console.log("fired"));
  }

  public async CargaExitosa(credito: Creditos) {

    const alert = await  this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Carga exitosa',
      subHeader: 'Se acreditó ' + credito.credito + ' en el usuario ' + credito.usuario,
      buttons: ['OK']
    });
    await alert.present();
    this.router.navigate(['/home']);
  }

  public async CargaFallida(mensaje: string) {
    const alert = await  this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Error',
      subHeader: mensaje,
      buttons: ['OK']
    });
    await alert.present();
    this.salir();
    // this.router.navigate(['/login']);
  }

  public async CargaDuplicada(mensaje: string) {

    const alert = await  this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Error',
      subHeader: mensaje,
      buttons: ['OK']
    });
    await alert.present();
    this.salir();
    // this.router.navigate(['/login']);
  }

  public async BorradoExitoso(mensaje: string) {

    const alert = await  this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Borrado Exitoso',
      subHeader: mensaje,
      buttons: ['OK']
    });
    await alert.present();
    this.salir();
    // this.router.navigate(['/login']);
  }

}