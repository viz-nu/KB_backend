import { Kind } from 'graphql';

function expandSelections(selections, fragments) {
    const out = [];
    for (const sel of selections) {
        if (sel.kind === Kind.FIELD) out.push(sel);
        else if (sel.kind === Kind.INLINE_FRAGMENT && sel.selectionSet) {
            out.push(...expandSelections(sel.selectionSet.selections, fragments));
        } else if (sel.kind === Kind.FRAGMENT_SPREAD) {
            const def = fragments[sel.name.value];
            if (def?.selectionSet) out.push(...expandSelections(def.selectionSet.selections, fragments));
        }
    }
    return out;
}

/**
 * GraphQL field names requested under a path of FIELD selections from this resolver's field.
 *
 * @param {import('graphql').GraphQLResolveInfo} info - 4th resolver argument
 * @param {string[]} path - Walk FIELD names; e.g. `['data']` for `users { data { name email } }`
 * @returns {Set<string>} Leaf field names at that position (__typename omitted)
 */
export function getRequestedFieldNames(info, path = []) {
    const { fragments } = info;
    let selections = [];
    for (const node of info.fieldNodes) {
        if (node.selectionSet) selections.push(...node.selectionSet.selections);
    }

    for (const segment of path) {
        selections = expandSelections(selections, fragments);
        const field = selections.find((s) => s.kind === Kind.FIELD && s.name.value === segment);
        if (!field?.selectionSet) return new Set();
        selections = field.selectionSet.selections;
    }

    selections = expandSelections(selections, fragments);
    const names = new Set();
    const stack = [...selections];
    while (stack.length) {
        const sel = stack.pop();
        if (sel.kind === Kind.FIELD) {
            if (sel.name.value !== '__typename') names.add(sel.name.value);
            if (sel.selectionSet) stack.push(...sel.selectionSet.selections);
        } else if (sel.kind === Kind.INLINE_FRAGMENT && sel.selectionSet) {
            stack.push(...sel.selectionSet.selections);
        } else if (sel.kind === Kind.FRAGMENT_SPREAD) {
            const def = fragments[sel.name.value];
            if (def?.selectionSet) stack.push(...def.selectionSet.selections);
        }
    }
    return names;
}
