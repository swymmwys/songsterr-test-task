export interface Message {
  id: string;
  content: string;
  date: Date;
}

export interface Log {
  id: string;
  text: string;
  date: Date;
}

export interface Database {
  message: Message;
  log: Log;
}