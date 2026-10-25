// Adaptador del puerto de almacenamiento sobre localStorage. Los datos nunca salen del navegador.
// Puede fallar (modo privado, almacenamiento bloqueado): entonces la web funciona sin recordar nada.
const KEY='papeleta29n-v2', OLD_KEY='papeleta29n-v1';

export const browserStorage={
  load(){
    try{return JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(OLD_KEY)||'null')}catch(e){return null}
  },
  save(data){
    try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}
  }
};
