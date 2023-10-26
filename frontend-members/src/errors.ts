export class DomainError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'DomainError'
    }
}

export class DomainObjectCreationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'DomainObjectCreationError'
    }
}

export class ConnectivityError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'Connectivity Error'
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'Authentication Error'
    }
}
