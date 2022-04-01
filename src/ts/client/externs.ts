/**
 * @fileoverview define externs for libs used in Silex
 */

/**
 * cloud explorer externs
 */
export interface CloudExplorer {
  getServices(): Promise<any>
  openFile(extensions): Promise<any>
  openFiles(extensions): Promise<any>
  openFolder(): Promise<any>
  write(data, blob): Promise<any>
  read(blob): Promise<any>
  saveAs(defaultFileName, extensions): Promise<any>
}

/**
 * unifile externs
 */
export interface UnifileResponse {
   success: boolean
   message?: string
   tempLink?: string
   code?: string
 }

