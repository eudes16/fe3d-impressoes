// three.js não publica .d.ts para os loaders em three/examples/jsm — só o
// pacote principal. Declaração mínima só do que usamos (parse síncrono).
declare module "three/examples/jsm/loaders/3MFLoader.js" {
  import { Group, Loader, LoadingManager } from "three"

  export class ThreeMFLoader extends Loader {
    constructor(manager?: LoadingManager)
    parse(data: ArrayBuffer): Group
  }
}
