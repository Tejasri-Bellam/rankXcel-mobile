// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { StatusBar } from 'react-native';
// import HomeScreen from './../components/home/HomeScreen';
// import LoginScreen from '../components/home/LoginScreen';
// import SignupScreen from '../components/home/SignupScreen';

// export type RootStackParamList = {
//   Home: undefined;
//   Login: undefined;
//   Signup: undefined;
// };

// const Stack = createNativeStackNavigator<RootStackParamList>();

// const App = () => {
//   return (
//     <NavigationContainer>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
//       <Stack.Navigator
//         initialRouteName="Home"
//         screenOptions={{
//           headerShown: false,
//         }}
//       >
//         <Stack.Screen name="Home" component={HomeScreen} />
//         <Stack.Screen name="Login" component={LoginScreen} />
//         <Stack.Screen name="Signup" component={SignupScreen} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default App;



import HomeScreen from '../components/home/HomeScreen';

export default HomeScreen;