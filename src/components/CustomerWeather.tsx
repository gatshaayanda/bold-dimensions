"use client";
import { useCallback, useEffect, useState } from "react";

type Conditions={temperature:number;feelsLike:number;humidity:number;wind:number;code:number;day:number};
const DEFAULT={latitude:-24.6282,longitude:25.9231,label:"Gaborone"};
function describe(code:number){if(code===0)return "Clear sky";if([1,2].includes(code))return "Partly cloudy";if(code===3)return "Cloudy";if([45,48].includes(code))return "Foggy";if([51,53,55,56,57].includes(code))return "Light drizzle";if([61,63,65,66,67,80,81,82].includes(code))return "Rain";if([71,73,75,77,85,86].includes(code))return "Snow / hail";if([95,96,99].includes(code))return "Thunderstorms";return "Current conditions"}
function icon(code:number){if(code===0)return "☀";if([1,2].includes(code))return "◐";if([45,48,3].includes(code))return "☁";if([95,96,99].includes(code))return "ϟ";if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return "☂";return "◌"}
export default function CustomerWeather(){
 const [place,setPlace]=useState(DEFAULT.label);
 const [conditions,setConditions]=useState<Conditions|null>(null);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState("");
 const [coordinates,setCoordinates]=useState(DEFAULT);
 const load=useCallback(async(coords=coordinates)=>{
  setBusy(true);setError("");
  try{
   const params=new URLSearchParams({latitude:String(coords.latitude),longitude:String(coords.longitude),current:"temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day,wind_speed_10m",timezone:"auto"});
   const response=await fetch("https://api.open-meteo.com/v1/forecast?"+params.toString(),{cache:"no-store"});
   if(!response.ok)throw new Error("Weather is temporarily unavailable.");
   const data=await response.json() as {current?:{temperature_2m:number;relative_humidity_2m:number;apparent_temperature:number;weather_code:number;is_day:number;wind_speed_10m:number}};
   if(!data.current)throw new Error("No current weather data was returned.");
   setConditions({temperature:data.current.temperature_2m,feelsLike:data.current.apparent_temperature,humidity:data.current.relative_humidity_2m,wind:data.current.wind_speed_10m,code:data.current.weather_code,day:data.current.is_day});
  }catch(cause){setError(cause instanceof Error?cause.message:"Weather could not be loaded.");}
  finally{setBusy(false)}
 },[coordinates]);
 useEffect(()=>{void load(DEFAULT)},[]);
 function useLocation(){
  if(!navigator.geolocation){setError("Location is not available in this browser.");return}
  setBusy(true);setError("");
  navigator.geolocation.getCurrentPosition(position=>{
   const next={latitude:position.coords.latitude,longitude:position.coords.longitude,label:"Your location"};
   setCoordinates(next);setPlace(next.label);void load(next);
  },()=>{setBusy(false);setError("Location permission was not granted. Showing Gaborone weather.");},{enableHighAccuracy:false,timeout:8000,maximumAge:300000});
 }
 return <section className="bdCustomerWeather" aria-label="Local weather">
  <div className="bdCustomerWeatherTop"><div><span className="bdEyebrow">LOCAL CONDITIONS</span><strong>{place}</strong></div><div className="bdWeatherActions"><button type="button" onClick={useLocation}>Use my location</button><button type="button" onClick={()=>void load()} aria-label="Refresh weather" disabled={busy}>↻</button></div></div>
  {busy&&!conditions?<p className="bdWeatherLoading">Checking current conditions…</p>:conditions?<div className="bdWeatherCurrent"><span className="bdWeatherIcon" aria-hidden="true">{icon(conditions.code)}</span><div className="bdWeatherTemperature"><strong>{Math.round(conditions.temperature)}°</strong><span>{describe(conditions.code)}</span></div><div className="bdWeatherDetails"><span>Feels like {Math.round(conditions.feelsLike)}°</span><span>Humidity {conditions.humidity}%</span><span>Wind {Math.round(conditions.wind)} km/h</span></div></div>:<p className="bdWeatherLoading">Weather is unavailable right now.</p>}
  {error&&<p className="bdWeatherError" role="status">{error}</p>}
  <small className="bdWeatherFoot">Live weather · Open-Meteo</small>
 </section>;
}
