import * as React from 'react';
import {Field, Label, Input, Checkbox, Radio} from '@zendeskgarden/react-forms';
import {Button} from "@zendeskgarden/react-buttons";
import {useState} from "react";

type Props = {
    onDone: () => void;
}

export default (props: Props) => {
    const [name, setName] = useState<string>("");
    const [enabled, setEnabled] = useState<boolean>(false);
    const [type, setType] = useState<"cycle" | "random-same" | "random-different">();

    const onSave = () => {
        // ...
    };

    return <>
        <Field>
            <Label>Name</Label>
            <Input value={name} onChange={(e: any) => setName(e.target.value)}/>
        </Field>

        Type:
        <Field>
            <Radio
                name="type"
                value="cycle"
                checked={type === 'cycle'}
                onChange={(event: any) => setType(event.target.value)}
            >
                <Label>Cycle</Label>
            </Radio>
        </Field>
        <Field>
            <Radio
                name="type"
                value="random-same"
                checked={type === 'random-same'}
                onChange={(event: any) => setType(event.target.value)}
            >
                <Label>Random (same for all lights)</Label>
            </Radio>
        </Field>
        <Field>
            <Radio
                name="type"
                value="random-different"
                checked={type === 'random-different'}
                onChange={(event: any) => setType(event.target.value)}
            >
                <Label>Random (per light)</Label>
            </Radio>
        </Field>

        <p>Enable the task to start it running as soon as it is saved.</p>
        <Field>
            <Checkbox checked={enabled} onChange={() => setEnabled(!enabled)}>
                <Label>Enabled</Label>
            </Checkbox>
        </Field>

        <Button isPrimary onClick={onSave}>
            Save
        </Button>
        <Button onClick={props.onDone}>
            Cancel
        </Button>
    </>;
};
