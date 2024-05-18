export interface User {
  data: {
    me: {
      id: string;
      email: string;
      name: string;
    }
  },
  account_id: number
}

export interface DecodedToken {
  dat: {
    client_id: string,
    user_id: number,
    account_id: number,
    slug: string,
    app_id: number,
    app_version_id: number,
    install_id: number,
    is_admin: boolean,
    is_view_only: boolean,
    is_guest: boolean,
    user_kind: string
  },
  exp: number
}

export type Mutations = {
  mutation: string;
  dateToExecute: string;
}

export type MutationBody = {
  mutations: Mutations[]
}

export type Task = {
  id: number;
  schedule_date: string;
  account_id: number;
  user_id: number;
  executed: boolean;
  mutation: string;
  new_item_id: number;
}

export type UserForDb = {
  id?: number;
  created_at?: string;
  monday_user_id: string;
  access_token?: string;
  email_address?: string;
  name?: string;
}