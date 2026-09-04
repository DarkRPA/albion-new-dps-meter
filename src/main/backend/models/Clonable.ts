
/**
 * Interfaz Clonable<T>
 * Permite la clonación profunda de los objetos que la implementen.
 * Para una clonación correcta, los tipos no primitivos de la clase que implemente la interfaz también deberán implementarla
 * y darle la lógica que requieran
 */
export interface Clonable<T>{
  /**
   * Clona el objeto de forma profunda
   */
  clone():T;
}
