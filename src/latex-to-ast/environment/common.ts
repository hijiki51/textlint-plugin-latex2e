/*
 * This file is part of textlint-plugin-latex2e
 *
 * textlint-plugin-latex2e is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * textlint-plugin-latex2e is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with textlint-plugin-latex2e.  If not, see <http://www.gnu.org/licenses/>.
 */

import Parsimmon from "parsimmon";
import { Rules } from "../rules";

export interface EnvironmentNode {
  name: string;
  arguments: any[];
  body: any;
}

interface Context {
  name: string;
  parents: string[];
}

export const BeginEnvironment = (
  pattern: string,
  context: Context,
  additionalRegex: string = ''
): Parsimmon.Parser<string> =>
  Parsimmon((input, i) => {
    const m = input.slice(i).match(new RegExp(`^\\\\begin\\{(${pattern})\\}` + additionalRegex));
    if (m !== null) {
      if(context.name !== '') context.parents.push(context.name);
      context.name = m[1];
      return Parsimmon.makeSuccess(i + m[0].length, m[1]);
    } else {
      return Parsimmon.makeFailure(i, `\\begin{${pattern}}`);
    }
  });

export const EndEnvironment = (context: Context): Parsimmon.Parser<null> =>
  Parsimmon((input, i) => {
    const p = context.name.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
    const m = input.slice(i).match(new RegExp(`^\\\\end\\{${p}\\}`));
    if (m !== null) {
      context.name = context.parents.pop() || '';
      return Parsimmon.makeSuccess(i + m[0].length, null);
    } else {
      return Parsimmon.makeFailure(i, `\\end{${p}}`);
    }
  });

export const Environment = (r: Rules) => {
  const context = { name: "", parents: [] };
  const option = r.Option;
  const argument = r.Argument;
  return Parsimmon.seqObj<EnvironmentNode>(
    ["name", BeginEnvironment(".*?", context)],
    ["arguments", Parsimmon.alt(option, argument).many()],
    ["body", r.Program],
    EndEnvironment(context)
  ).node("environment");
};
