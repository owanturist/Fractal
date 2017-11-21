import {
    Result,
    Err,
    Ok
} from '../Result';


export type Decoder<T>
    = Primitive<T>
    | Field<T>
    | Map<any, T>
    | Map2<any, any, T>
    ;

interface Primitive<T> {
    readonly ctor: '@Json/Decode|Decoder#Primitive';
    readonly _0: string;
    readonly _1: (value: any) => value is T;
}

export const string: Decoder<string> = {
    ctor: '@Json/Decode|Decoder#Primitive',
    _0: 'string',
    _1: (value: any): value is string => typeof value === 'string'
};

export const bool: Decoder<boolean> = {
    ctor: '@Json/Decode|Decoder#Primitive',
    _0: 'bool',
    _1: (value: any): value is boolean => typeof value === 'boolean'
};

export const number: Decoder<number> = {
    ctor: '@Json/Decode|Decoder#Primitive',
    _0: 'number',
    _1: (value: any): value is number => typeof value === 'number'
};

interface Field<T> {
    readonly ctor: '@Json/Decode|Decoder#Field';
    readonly _0: string;
    readonly _1: Decoder<T>;
}

export const field = <T>(key: string, decoder: Decoder<T>): Decoder<T> => ({
    ctor: '@Json/Decode|Decoder#Field',
    _0: key,
    _1: decoder
});

interface Map<T, R> {
    readonly ctor: '@Json/Decode|Decoder#Map';
    readonly _0: (value: T) => R;
    readonly _1: Decoder<T>;
}

export const map = <T, R>(fn: (value: T) => R, decoder: Decoder<T>): Decoder<R> => ({
    ctor: '@Json/Decode|Decoder#Map',
    _0: fn,
    _1: decoder
});

interface Map2<T1, T2, R> {
    readonly ctor: '@Json/Decode|Decoder#Map2';
    readonly _0: (t1: T1, t2: T2) => R;
    readonly _1: Decoder<T1>;
    readonly _2: Decoder<T2>;
}

export const map2 = <T1, T2, R>(
    fn: (t1: T1, t2: T2) => R,
    d1: Decoder<T1>,
    d2: Decoder<T2>
): Decoder<R> => ({
    ctor: '@Json/Decode|Decoder#Map2',
    _0: fn,
    _1: d1,
    _2: d2
})

export const decodeValue = <T>(decoder: Decoder<T>, value: any): Result<string, T> => {
    switch (decoder.ctor) {
        case '@Json/Decode|Decoder#Primitive': {
            return decoder._1(value)
                ? Ok(value)
                : Err('Value `' + JSON.stringify(value) + '` is not a ' + decoder._0 + '.')
        }

        case '@Json/Decode|Decoder#Field': {
            if (typeof value !== 'object' || value === null) {
                return Err('Value `' + JSON.stringify(value) + '` is not an object.');
            }

            return decoder._0 in value
                ? decodeValue(decoder._1, value[ decoder._0 ])
                : Err('Field `' + decoder._0 + '` doesn\'t exist in an object ' + JSON.stringify(value) + '.');
        }

        case '@Json/Decode|Decoder#Map': {
            return Result.map(
                decoder._0,
                decodeValue(decoder._1, value)
            );
        }

        case '@Json/Decode|Decoder#Map2': {
            return Result.map2(
                decoder._0,
                decodeValue(decoder._1, value),
                decodeValue(decoder._2, value)
            );
        }
    }
}
