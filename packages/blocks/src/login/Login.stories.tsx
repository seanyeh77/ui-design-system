import { Login } from './Login';

export default { title: 'Blocks/Login', component: Login, parameters: { layout: 'fullscreen' } };

export const Default = {
  args: {
    brand: '專案中心',
    forgotHref: '#',
    signIn: async (_account: string, password: string) => (password === 'demo' ? null : { password: '帳號或密碼不正確，請再試一次。' }),
  },
};
