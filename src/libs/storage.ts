import AsyncStorage from "@react-native-async-storage/async-storage";

const StorageKeys = {
    USERNAME: 'username',
    ACCESSTOKEN: 'accessToken',
    SESSIONID: 'sessionId',
} as const

export async function storageSetAccessToken(accessToken: string) {
    await AsyncStorage.setItem(StorageKeys.ACCESSTOKEN, accessToken);
}
 
export async function storageGetAccessToken() {
    const accessToken = await AsyncStorage.getItem(StorageKeys.ACCESSTOKEN);
    return accessToken || '';
}