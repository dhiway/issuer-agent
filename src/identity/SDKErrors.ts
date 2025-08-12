export class SDKError extends Error {
    public errorCode: ErrorCode;

    public constructor(errorCode: ErrorCode, message: string) {
        super(message);
        this.errorCode = errorCode;
    }
}
export enum ErrorCode {
    /* eslint-disable no-unused-vars */
    ERROR_MNEMONIC_PHRASE_MALFORMED = 20012,
    ERROR_MNEMONIC_PHRASE_INVALID = 30008,
}
export const ERROR_MNEMONIC_PHRASE_MALFORMED: () => SDKError = () => {
    return new SDKError(
        ErrorCode.ERROR_MNEMONIC_PHRASE_MALFORMED,
        'Mnemonic phrase malformed or too short'
    );
};

export const ERROR_MNEMONIC_PHRASE_INVALID: () => SDKError = () => {
    return new SDKError(
        ErrorCode.ERROR_MNEMONIC_PHRASE_INVALID,
        'Mnemonic phrase invalid'
    );
};
