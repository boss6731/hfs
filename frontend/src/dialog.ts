// This file is part of HFS - Copyright 2021-2023, Massimo Melina <a@rejetto.com> - License https://www.gnu.org/licenses/gpl-3.0.txt

import { createElement as h, ReactElement, ReactNode, useEffect, useRef, useState } from 'react'
import './dialog.css'
import { newDialog, closeDialog, DialogOptions, DialogCloser } from '@hfs/shared/dialogs'
import _ from 'lodash'
import { useInterval } from 'usehooks-ts'
import { t } from './i18n'
import { err2msg } from './misc'
export * from '@hfs/shared/dialogs'

interface PromptOptions extends Partial<DialogOptions> { def?:string, type?:string, trim?: boolean }
export async function promptDialog(msg: string, { def, type, trim=true, ...rest }:PromptOptions={}) : Promise<string | null> {
    return new Promise(resolve => newDialog({
        className: 'dialog-prompt',
        icon: '?',
        onClose: resolve,
        ...rest,
        Content
    }) )

    function Content() {
        const ref = useRef<HTMLInputElement>()
        useEffect(()=>{
            const e = ref.current
            if (!e) return
            const inp = e as HTMLInputElement
            setTimeout(()=> inp.focus(),100)
            if (def)
                inp.value = def
        },[])
        return h('form', {},
            h('label', { htmlFor: 'input' }, msg),
            h('input', {
                ref,
                type,
                name: 'input',
                style: {
                    width: def ? (def.length / 2) + 'em' : 'auto',
                    minWidth: '100%', maxWidth: '100%'
                },
                autoFocus: true,
                onKeyDown(ev: KeyboardEvent) {
                    const { key } = ev
                    if (key === 'Escape')
                        return closeDialog(null)
                    if (key === 'Enter')
                        return go()
                }
            }),
            h('div', { style: { textAlign: 'right', marginTop: '.8em' } },
                h('button', {  onClick: go }, t`Continue`)),
        )

        function go() {
            let res = ref.current?.value
            if (trim)
                res = res?.trim()
            closeDialog(res)
        }
    }
}

type AlertType = 'error' | 'warning' | 'info'

export async function alertDialog(msg: ReactElement | string | Error, type:AlertType='info', { getClose=_.noop }={}) {
    if (msg instanceof Error)
        type = 'error'
    return new Promise(resolve => getClose(newDialog({
        className: 'dialog-alert dialog-alert-'+type,
        title: t(_.capitalize(type)),
        icon: '!',
        onClose: resolve,
        Content
    })))

    function Content(){
        if (msg instanceof Error)
            msg = err2msg(msg)
        if (typeof msg === 'string')
            msg = h('p', {}, String(msg))
        return msg
    }
}

export interface ConfirmOptions extends Partial<DialogOptions> {
    href?: string
    afterButtons?: ReactNode
    timeout?: number
    timeoutConfirm?: boolean
    getClose?: (cb: DialogCloser) => unknown
}
export async function confirmDialog(msg: ReactElement | string, options: ConfirmOptions={}) : Promise<unknown> {
    const { href, afterButtons, timeout, timeoutConfirm=false, getClose=_.noop, ...rest } = options
    if (typeof msg === 'string')
        msg = h('p', {}, msg)
    return new Promise(resolve =>
        getClose(newDialog({
            className: 'dialog-confirm',
            icon: '?',
            onClose: resolve,
            ...rest,
            Content
        })) )

    function Content() {
        const [sec,setSec] = useState(Math.ceil(timeout||0))
        useInterval(() => setSec(x => Math.max(0, x-1)), 1000)
        const missingText = timeout!>0 && ` (${sec})`
        useEffect(() => {
            if (timeout && !sec)
                closeDialog(timeoutConfirm)
        }, [sec])
        return h('div', {},
            msg,
            h('div', {
                style: {
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '1em'
                },
            },
                h('a', {
                    href,
                    onClick() { closeDialog(true) },
                }, h('button', {}, t`Confirm`, timeoutConfirm && missingText)),
                h('button', {
                    onClick() { closeDialog(false) },
                }, t`Don't`, !timeoutConfirm && missingText),
                afterButtons,
            )
        )
    }
}

