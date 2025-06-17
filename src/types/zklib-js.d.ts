declare module 'zklib-js' {
    export interface ZKResponse {
      code: number;
      data?: any;
      message?: string;
    }
  
    export default class ZKLib {
      constructor(ip: string, port: number, timeout?: number, inport?: number);
      createSocket(): Promise<ZKResponse>;
      disconnect(): Promise<ZKResponse>;
      getInfo(): Promise<ZKResponse>;
      getTotalUsers(): Promise<ZKResponse>;
      getUsers(): Promise<ZKResponse>;
      setUser(
        userId: number,
        name: string,
        password: string,
        role: number,
        cardno?: Buffer
      ): Promise<ZKResponse>;
      removeUser(userId: number): Promise<ZKResponse>;
      getAttendanceLogs(): Promise<ZKResponse>;
      clearAttendanceLogs(): Promise<ZKResponse>;
      restartDevice(): Promise<ZKResponse>;
    }
  }