import { Effect } from '../src/remade';
import { inst } from '../src/Basics';


// M O D E L

export interface Model {
    count: number;
}

export const init: [ Model, Array<Effect<Msg>> ] = [
    {
        count: 0
    },
    [
        dispatch => dispatch(Increment)
    ]
];

// U P D A T E

export interface Msg {
    update(model: Model): [ Model, Array<Effect<Msg>> ];
}

export const Decrement = inst(class Decrement implements Msg {
    public update(model: Model): [ Model, Array<Effect<Msg>> ] {
        return [
            {
                ...model,
                count: model.count + 1
            },
            []
        ];
    }
});

export const Increment = inst(class Increment implements Msg {
    public update(model: Model): [ Model, Array<Effect<Msg>> ] {
        return [
            {
                ...model,
                count: model.count + 1
            },
            []
        ];
    }
});
