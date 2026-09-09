import type AuthenticationResponse from "../models/AuthenticationResponse.model";
import type Claim from "../models/Claim.model";

const tokenKey = 'token';
const expirationKey = 'token-expiration';

export function storeToken(authenticationResponse: AuthenticationResponse){
    localStorage.setItem(tokenKey, authenticationResponse.token);
    localStorage.setItem(expirationKey, authenticationResponse.expiration.toString());
}

export function getClaims(): Claim[]{
    const token = getToken();

    if (!token){
        return [];
    }

    try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) {
            throw new Error('The stored token is malformed.');
        }

        const normalizedPayload = payloadBase64
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(Math.ceil(payloadBase64.length / 4) * 4, '=');
        const payloadBytes = Uint8Array.from(atob(normalizedPayload), character => character.charCodeAt(0));
        const payloadJson = new TextDecoder().decode(payloadBytes);
        const dataToken = JSON.parse(payloadJson);

        const claims: Claim[] = Object.entries(dataToken).map(([name, value]) => ({name, value: String(value)}));

        return claims;
    }
    catch(err){
        console.error(err);
        logout();
        return [];
    }
}

export function logout(){
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(expirationKey);
}

export function getToken(){
    const token = localStorage.getItem(tokenKey);
    const expiration = localStorage.getItem(expirationKey);

    if (!token || !expiration) {
        return null;
    }

    const expirationDate = new Date(expiration);

    if (Number.isNaN(expirationDate.getTime()) || expirationDate <= new Date()) {
        logout();
        return null;
    }

    return token;
}

export function userIsLoggedIn(){
    const claims = getClaims();
    return claims.length > 0;
}
