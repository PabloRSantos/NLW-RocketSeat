import knex from "../database/connection"
import {Request, Response} from "express"

class pointsController {
    async index (req: Request, res: Response){
        const {city, uf, items} = req.query

        const parsedItems = String(items)
        .split(",")
        .map(item => Number(item.trim()))

        const point = await knex("points")
        .join("point_items", "points.id", "=", "point_items.point_id")
        .whereIn("point_items.item_id", parsedItems)
        .where("city", String(city))
        .where("uf", String(uf))
        .distinct()
        .select("points.*")

        const serializedPoints = point.map(point => {
            return {
                ...point,
                image_url: `http://10.0.0.119:3333/uploads/${point.image}`
            }
        })

        return res.json(serializedPoints)

    }

    async show (req: Request, res: Response){
        const { id } = req.params

        const point = await knex("points").where("id", id).first()

        if(!point){
            return res.status(400).json({message: "point not found"})
        }

        const serializedPoint = {
                ...point,
                image_url: `http://10.0.0.119:3333/uploads/${point.image}`
            }

        const items = await knex("items")
        .join("point_items", "items.id", "=", "point_items.item_id")
        .where("point_items.point_id", id)
        .select("items.title")

        return res.json({serializedPoint, items})

    }
    
    async create (req: Request, res: Response){
        
        
        const {
        name,
        email,
        whatsapp,
        latitude,
        longitude,
        city,
        uf,
        items
        } = req.body

        const trx = await knex.transaction() //se 1 insert n da certo, ele cancela o outro

        const point = {
        image: req.file.filename,
        name,
        email,
        whatsapp,
        latitude,
        longitude,
        city,
        uf
    }

        const idsPoint = await trx("points").insert(point)

        const point_id = idsPoint[0]

        //trim tira os espacos
        const pointItems = items.split(",")
        .map((item: string) => Number(item.trim()))
        .map((item_id: number) => {
                return {
                        item_id,
                        point_id,
                }
        })

        await trx("point_items").insert(pointItems)

        await trx.commit() //n esquecer de botar

        return res.json({id: point_id, ...point})
}
}

export default pointsController