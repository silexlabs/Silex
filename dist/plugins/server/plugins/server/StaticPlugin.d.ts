type StaticOptions = {
    routes: {
        path: string;
        route: string;
    }[];
};
export default function (config: any, options?: StaticOptions): Promise<void>;
export {};
