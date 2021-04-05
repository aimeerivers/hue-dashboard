import * as React from 'react';
import {Field, Label, Input, Checkbox, Radio, Range, Hint, Message} from '@zendeskgarden/react-forms';
import {Button} from "@zendeskgarden/react-buttons";
import {ChangeEvent, useState} from "react";
import LightIdHints from "./LightIdHints";

type Props = {
    onDone: () => void;
    taskId?: string;
    name?: string;
    enabled?: boolean;
    type?: "cycle" | "random-same" | "random-different";
    lightIds?: (string | string[])[];
    transitionTimeSeconds?: number;
    intervalSeconds?: number;
    phaseDelaySeconds?: number;
    maxIterations?: number;
}

export default (props: Props) => {
    const [name, setName] = useState<string>(props.name ?? "");
    const [enabled, setEnabled] = useState<boolean>(props.enabled ?? true);
    const [type, setType] = useState<"cycle" | "random-same" | "random-different">(props.type ?? "random-different");
    const [lightIdsText, setLightIdsText] = useState<string>(
        props.lightIds ? props.lightIds.map(
            t => typeof t === 'string' ? t : t.join("+")
        ).join(" ") : "");
    const [transitionTimeSeconds, setTransitionTimeSeconds] = useState<number>(props.transitionTimeSeconds ?? 0.4);
    const [intervalSeconds, setIntervalSeconds] = useState<number>(props.intervalSeconds ?? 1);
    const [phaseDelaySeconds, setPhaseDelaySeconds] = useState<number>(props.phaseDelaySeconds ?? 0);
    const [maxIterationsText, setMaxIterationsText] = useState<string>((props.maxIterations ?? 0).toString());

    const maxIterations: number | undefined = (
        maxIterationsText.trim() === ''
            ? undefined
            : parseFloat(maxIterationsText)
    );

    const lightIds = lightIdsText
        .split(/\s+/)
        .filter(t => t !== "")
        .map(t => t.split('+'))
        .map((idOrGroup: string[]) => idOrGroup.length === 1 ? idOrGroup[0] : idOrGroup);

    const isValid = () => {
        if (maxIterations !== undefined && isNaN(maxIterations)) return false;
        if (lightIds.length === 0) return false;
        return true;
    };

    const onSave = (): Promise<string> => {
        const task: any = {
            name,
            enabled,
            type,
            lightIds,
            intervalSeconds,
            transitionTimeSeconds,
            maxIterations: maxIterations || null,
        };

        if (type === 'random-same' || type === 'random-different')
            task.phaseDelaySeconds = phaseDelaySeconds;

        return fetch(
            `/background`,
            { method: "POST", body: JSON.stringify(task), headers: { "Content-Type": "application/json"} },
        )
            .then(r => {
                if (r.status === 200) return r.json().then(data => data.id);

                throw `wanted 200, got ${r.status} ${r.statusText}`;
            });
    };

    const onCreate = () => {
        if (!isValid()) return;

        onSave().then(() => props.onDone());
    };

    const doDelete = () =>
        fetch(`/background/${props.taskId}`, { method: 'DELETE'})
            .then(r => {if (r.status !== 204) throw `wanted 204, got ${r.status} ${r.statusText}`;})
            ;

    const onUpdate = () => {
        if (!isValid()) return;

        onSave()
            .then(() => fetch(`/background/${props.taskId}`, { method: 'DELETE'}))
            .then(r => {if (r.status !== 204) throw `wanted 204, got ${r.status} ${r.statusText}`;})
            .then(() => doDelete())
            .then(() => props.onDone())
    };

    const onDelete = () => {
        doDelete().then(() => props.onDone());
    };

    return <div style={{maxWidth: "30em", marginLeft: "1em"}}>
        <Field>
            <Label>Enter a name for the task (optional)</Label>
            <Input value={name} onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}/>
        </Field>

        <br/>

        <Field>
            <Radio
                name="type"
                value="cycle"
                checked={type === 'cycle'}
                onChange={() => setType('cycle')}
            >
                <Label>Cycle</Label>
            </Radio>
        </Field>
        <Field>
           <Radio
                name="type"
                value="random-same"
                checked={type === 'random-same'}
                onChange={() => setType('random-same')}
            >
                <Label>Random (same for all lights)</Label>
            </Radio>
        </Field>
        <Field>
            <Radio
                name="type"
                value="random-different"
                checked={type === 'random-different'}
                onChange={() => setType('random-different')}
            >
                <Label>Random (per light)</Label>
            </Radio>
        </Field>

        <br/>

        <Field>
            <Label>Enter the light IDs to control (ugh)</Label>
            <Input value={lightIdsText} onChange={(e: ChangeEvent<HTMLInputElement>) => setLightIdsText(e.target.value)}/>
            {lightIds.length > 0 && <Hint><LightIdHints lightIds={lightIds}/></Hint>}
        </Field>

        <br/>

        <Field>
            <Label>Transition time</Label>
            <Hint>
                {transitionTimeSeconds === 0
                    ? 'immediate'
                    : transitionTimeSeconds === 1
                ? '1 second' : `${transitionTimeSeconds} seconds`}
            </Hint>
            <Range
                value={transitionTimeSeconds}
                min={0} max={10} step={0.1}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTransitionTimeSeconds(parseFloat(e.target.value))}
            />
        </Field>

        <br/>

        <Field>
            <Label>Interval</Label>
            <Hint>
                {intervalSeconds === 1 ? '1 second' : `${intervalSeconds} seconds`}
            </Hint>
            <Range
                value={intervalSeconds}
                min={0.1} max={60} step={0.1}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setIntervalSeconds(parseFloat(e.target.value))}
            />
        </Field>

        <br/>

        {type !== 'cycle' && <>
            <Field>
                <Label>Phase delay</Label>
                <Hint>
                    {phaseDelaySeconds === 0
                        ? 'no delay'
                        : phaseDelaySeconds === 1
                            ? '1 second' : `${phaseDelaySeconds} seconds`}
                </Hint>
                <Range
                    value={phaseDelaySeconds}
                    min={0} max={10} step={0.1}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPhaseDelaySeconds(parseFloat(e.target.value))}
                />
            </Field>

            <br/>
        </>}

        <Field>
            <Label>Max iterations (optional)</Label>
            {!!maxIterations
                && <Hint>
                    {phaseDelaySeconds === 1 ? '1 second' : `${phaseDelaySeconds} seconds`}
                </Hint>
            }
            <Input
                value={maxIterationsText}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxIterationsText(e.target.value)}
            />
            {maxIterations !== undefined && isNaN(maxIterations)
                && <Message>Leave blank, or enter a number</Message>}
        </Field>

        <br/>

        <Field>
            <p>Enable the task if you want it to start running as soon as it is saved.</p>
            <Checkbox checked={enabled} onChange={() => setEnabled(!enabled)}>
                <Label>Enabled</Label>
            </Checkbox>
        </Field>

        <br/>

        <Button isPrimary onClick={props.taskId ? onUpdate : onCreate}>
            Save
        </Button>
        {props.taskId && <>
            {' '}
            <Button isPrimary onClick={onCreate}>
                Save as copy
            </Button>
            {' '}
            <Button isDanger onClick={onDelete}>
                Delete
            </Button>
        </>}
        {' '}
        <Button onClick={props.onDone}>
            Cancel
        </Button>
    </div>;
};
