import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'io.indicwisdom.app',
    appName: 'IndicWisdom',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
