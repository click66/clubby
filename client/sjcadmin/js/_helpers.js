export function withClasses(e, classList) {
    e.classList.add(...classList);
    return e;
}

export function withChild(parent, child) {
    parent.appendChild(child);
    return parent;
}

export class Icons {
    constructor(doc) {
        this.doc = doc;
    }

    make(key, classList = []) {
        return withClasses(this.doc.createElement('i'), classList.concat(`bi-${key}`));
    }
}

export class Badges {
    constructor(doc) {
        this.doc = doc;
    }

    #make(key, ...children) {
        return children.reduce(withChild, withClasses(this.doc.createElement('span'), ['badge', `bg-${key}`]));
    }

    primary(...children) {
        return this.#make('primary', ...children);
    }
    
    secondary(...children) {
        return this.#make('secondary', ...children);
    }

    success(...children) {
        return this.#make('success', ...children);
    }

    warning(...children) {
        return withClasses(this.#make('warning', ...children), ['text-dark']);
    }

    danger(...children) {
        return this.#make('danger', ...children);
    }
}
