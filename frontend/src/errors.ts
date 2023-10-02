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

export class DomainAdaptationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'DomainAdaptationError'
    }
}
