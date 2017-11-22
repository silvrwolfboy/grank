import ora from 'ora';
import pMap from 'p-map';
import format from 'date-fns/format';

import { json } from '../../utils/json';
import { cfonts } from '../../utils/cfonts';
import { basicTable } from '../../utils/table';
import { error, red, bold, neonGreen } from '../../utils/chalk';

const alignCenter = columns =>
    columns.map(content => ({ content, hAlign: 'left', vAlign: 'center' }));

const catchError = (err, apiName) => {
    error(err);
    console.log('');
    error(`Oops, ${apiName} goes wrong.`);
    error(
        'Please run grank again.\nIf it still does not work, feel free to open an issue on https://github.com/cdoco/grank/issues'
    );
    process.exit(1);
};

const user = async(query, option) => {
    let userInfos;
    //设定默认值
    query = query || 'location:china';
    option.num = option.num || 10;
    const userTable = basicTable();

    //title
    cfonts('Github Rank');

    userTable.push(
        alignCenter([
            bold(neonGreen("rank")),
            bold(neonGreen("username")),
            bold(neonGreen("name")),
            bold(neonGreen("location")),
            bold(neonGreen("blog")),
            bold(neonGreen("repos")),
            bold(neonGreen("followers")),
            bold(neonGreen("created")),
        ])
    );

    //loading style
    const spinner = ora('Loading GitHub Rank For User').start();

    try {
        const rsp = await json.get('/search/users?q=' + query, {
            params: {
                per_page: option.num,
                page: option.page,
                sort: option.sort,
                order: option.order
            }
        });
        userInfos = rsp.data;
    } catch (error) {
        spinner.stop();
        catchError(error, 'Users.All');
    }

    await pMap(
        userInfos.items,
        async(item, index) => {
            let detail;

            try {
                const rsp = await json.get(item.url);
                detail = rsp.data;
            } catch (error) {
                spinner.stop();
                catchError(error, 'Users.UserDetail');
            }

            const {
                login,
                name,
                location,
                blog,
                public_repos,
                followers,
                created_at
            } = detail;

            userTable.push(
                alignCenter([
                    ++index,
                    login,
                    name,
                    location,
                    blog,
                    public_repos,
                    followers,
                    format(created_at, 'YYYY/MM/DD'),
                ])
            );
        }, { concurrency: 1 }
    );

    spinner.stop();

    console.log(userTable.toString());
};

export default user;