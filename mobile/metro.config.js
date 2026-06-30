const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// LiveKit react-native-webrtc requiere estas extensiones extra
config.resolver.assetExts.push('db', 'mp4', 'm4a');
config.resolver.sourceExts.push('cjs');

module.exports = withNativeWind(config, { input: './global.css' });
