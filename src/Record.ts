type Fallback<T extends object> = Record<T> | T;

export abstract class Record<T extends object> {
    public static isRecord<T extends object>(something: any): something is Record<T> {
        return something instanceof Record;
    }

    public static toObject<T extends object>(recordOrObject: Fallback<T>): T {
        return Record.isRecord(recordOrObject) ? recordOrObject.toObject() : recordOrObject;
    }

    public static of<T extends object>(object: T): Record<T> {
        return new Proxy({ ...(object as object) } as T);
    }

    public abstract get<K extends keyof T>(key: K): T[ K ];

    public abstract set<K extends keyof T>(key: K, value: T[ K ]): Record<T>;

    public abstract update<K extends keyof T>(key: K, fn: (value: T[ K ]) => T[ K ]): Record<T>;

    public abstract assign(partial: {[ K in keyof T ]?: T[ K ]}): Record<T>;

    public abstract toObject(): T;
}

class Proxy<T extends object> extends Record<T> {
    constructor(private readonly object: T) {
        super();
    }

    public get<K extends keyof T>(key: K): T[ K ] {
        return this.object[ key ];
    }

    public set<K extends keyof T>(key: K, value: T[ K ]): Record<T> {
        return new Proxy({
            ...(this.object as object),
            [ key ]: value
        } as T);
    }

    public update<K extends keyof T>(key: K, fn: (value: T[ K ]) => T[ K ]): Record<T> {
        return new Proxy({
            ...(this.object as object),
            [ key ]: fn(this.object[ key ])
        } as T);
    }

    public assign(partial: {[ K in keyof T ]?: T[ K ]}): Record<T> {
        return new Proxy({
            ...(this.object as object),
            ...(partial as object)
        } as T);
    }

    public toObject(): T {
        return this.object;
    }
}
