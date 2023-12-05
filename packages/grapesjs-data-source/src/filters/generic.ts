/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */


import { html } from "lit"
import { DataSourceEditor } from ".."
import { Filter } from "../types"

export default function(editor: DataSourceEditor): Filter[] {
  return [
    {
      type: 'filter',
      id: 'as',
      label: 'as',
      validate: field => !!field && field?.kind !== 'list',
      output: (field, options) => field && options.type ? {
        ...field,
        typeIds: [options.type as string],
      } : null,
      apply: value => value,
      options: {
        type: 'String',
      },
      optionsForm: (field, options) => html`
        <form>
          <label for="type">Type</label>
          <small class="form-text text-muted">The type to cast to</small>
          <select class="form-control" id="type" name="type">
            ${ editor.DataSourceManager.getDataTree().allTypes.map(type => html`<option value="${type.id}" ${type.id === options.type ? 'selected': ''}>${type.label}</option>`) }
          </select>
          <div class="buttons">
            <input type="reset" value="Cancel"/>
            <input type="submit" value="Apply" />
          </div>
        </form>
      `,
    },
  ]
}